"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BotSignalIllustration } from "@/components/brand-illustrations";
import { BrandLogo } from "@/components/brand-logo";
import { BoltIcon } from "@/components/icons";
import {
  clearPendingCartAction,
  readPendingCartAction,
  savePendingCartAction
} from "@/lib/utils/pending-cart";
import { AssistantMascot } from "./assistant-mascot";

type ChatProductCard = {
  id: string;
  name: string;
  price: string;
  stock: number;
  imageUrl: string;
  url: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  products?: ChatProductCard[];
  source?: "ai" | "fallback";
  fallbackReason?: string;
  note?: string;
};

type ChatApiResponse = {
  sessionId?: string;
  reply?: string;
  replyChunks?: string[];
  products?: ChatProductCard[];
  quickActions?: string[];
  source?: "ai" | "fallback";
  fallbackReason?: string;
  typingStatus?: string;
  error?: string;
};

type TeaserContext = {
  quick: string[];
  teasers: string[];
};

const HINT_STORAGE_KEY = "10pila-chat-next-hint-at-v2";
const HINT_SESSION_SEEN_KEY = "10pila-chat-teaser-seen-v1";
const HINT_INITIAL_DELAY_MIN_MS = 5000;
const HINT_INITIAL_DELAY_SPREAD_MS = 3000;
const HOME_TEASER_COOLDOWN_MS = 1000 * 28;
const BROWSE_TEASER_COOLDOWN_MS = 1000 * 40;
const POST_CLOSE_COOLDOWN_MS = 1000 * 60 * 8;
const POST_OPEN_COOLDOWN_MS = 1000 * 60 * 30;
const TEASER_VISIBLE_MS = 12000;
const CHUNK_PAUSE_MIN_MS = 900;
const CHUNK_PAUSE_MAX_MS = 1800;
const MESSAGE_DEBOUNCE_MS = 650;
const FLOOD_THRESHOLD_MS = 1600;

function interactionNow() {
  return typeof performance !== "undefined" ? performance.now() : 0;
}

function currentProductSlug(pathname: string) {
  const match = pathname.match(/^\/produtos\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function renderInlineContent(line: string) {
  const parts = line
    .split(/(\[[^\]]+\]\((?:https?:\/\/[^)]+)\)|https?:\/\/[^\s]+)/g)
    .filter(Boolean);

  return parts.map((part, partIndex) => {
    const markdown = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);

    if (markdown) {
      return (
        <a
          className="chat-link"
          href={markdown[2]}
          key={`${markdown[2]}-${partIndex}`}
          rel="noreferrer"
          target="_blank"
        >
          {markdown[1]}
        </a>
      );
    }

    if (part.startsWith("http")) {
      let label = part;

      try {
        const url = new URL(part);
        label = url.pathname.replace(/^\/+/, "") || url.hostname;
        label = label.length > 30 ? `${label.slice(0, 27)}...` : label;
      } catch {
        label = "Abrir link";
      }

      return (
        <a
          className="chat-link"
          href={part}
          key={`${part}-${partIndex}`}
          rel="noreferrer"
          target="_blank"
        >
          {label}
        </a>
      );
    }

    return <span key={`${part}-${partIndex}`}>{part}</span>;
  });
}

function MessageContent({ content }: { content: string }) {
  return (
    <>
      {content.split("\n").map((line, lineIndex) => (
        <span className="chat-message-line block break-words" key={`${line}-${lineIndex}`}>
          {renderInlineContent(line)}
        </span>
      ))}
    </>
  );
}

export function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const isHomePage = pathname === "/";
  const isPurchasePage = pathname.startsWith("/carrinho") || pathname.startsWith("/checkout");
  const [open, setOpen] = useState(false);
  const [teaserLines, setTeaserLines] = useState<string[]>([]);
  const [nudgeTick, setNudgeTick] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Oi. Eu sou o PilaBot. Fala o que voce quer e eu vejo o que da pra te empurrar do estoque."
    }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverQuickActions, setServerQuickActions] = useState<{
    pathname: string;
    actions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("vendo no sistema");
  const [cartLoadingId, setCartLoadingId] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const nextHintAtRef = useRef(0);
  const lastScrollAtRef = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const replayedIntentRef = useRef(false);
  const requestAbortRef = useRef<AbortController | null>(null);
  const sendDebounceRef = useRef<number | null>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const lastUserMessageAtRef = useRef(0);

  const context = useMemo<TeaserContext>(() => {
    if (
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/auth/register") ||
      pathname.startsWith("/register")
    ) {
      return {
        quick: ["entrar", "redefinir senha", "criar conta"],
        teasers: [
          "Esqueceu a senha de novo, né?",
          "Vai tentar adivinhar até bloquear a conta?",
          "Põe o email certo dessa vez, namoral.",
          "Cria logo essa conta, não dói.",
          "Nem você lembra o email que usou.",
          "Loga aí pra eu não perder a venda.",
          "Quer ajuda pra lembrar a própria senha?",
          "Entra de uma vez pra não esvaziar o carrinho.",
          "Se trancar o acesso, vai sobrar pra mim.",
          "Clica logo em redefinir e para de sofrer."
        ]
      };
    }

    if (pathname.startsWith("/indicacoes")) {
      return {
        quick: ["como funciona", "ver meu link", "ver regras"],
        teasers: [
          "Trazendo amigo pra mendigar desconto, né?",
          "Queria eu ganhar comissão igual você.",
          "Fazendo o trabalho do marketing de graça, parabéns.",
          "Manda pro grupo da família de uma vez.",
          "Você ganha bônus e eu ganho mais trabalho.",
          "Chama aquele seu amigo pão-duro pra comprar.",
          "Aproveita que pelo menos você ganha algo aqui.",
          "Até você fazendo grana e eu aqui preso.",
          "Manda logo esse link, pra que tanta regra?",
          "Se o amigo comprar, quem embala sou eu."
        ]
      };
    }

    if (pathname.startsWith("/produtos/")) {
      return {
        quick: ["comparar esse produto", "ver detalhes", "adicionar ao carrinho"],
        teasers: [
          "Não vai baixar o preço, só avisando.",
          "Tá esperando um milagre pra levar esse?",
          "É, esse aí não é ruim. Vai querer?",
          "Compra logo, preciso fechar o dia.",
          "Tem dúvida no frete? Pergunta de uma vez.",
          "Vai jogar no carrinho e largar lá, né?",
          "Abre aqui que eu te falo se presta mesmo.",
          "Tá lendo a descrição ou só enrolando?",
          "Se for levar, agiliza a minha vida.",
          "Vai passar o cartão hoje ou só admirar?"
        ]
      };
    }

    if (pathname.startsWith("/carrinho")) {
      return {
        quick: ["revisar o carrinho", "tirar duvida de frete", "aplicar cupom", "fechar pedido"],
        teasers: [
          "Se travou no carrinho, fala.",
          "Cupom, frete, quantidade. Eu vejo.",
          "Dá pra resolver isso sem drama."
        ]
      };
    }

    if (pathname.startsWith("/checkout")) {
      return {
        quick: ["tirar duvida de entrega", "revisar pedido", "acompanhar pedido"],
        teasers: [
          "Se for entrega ou pagamento, eu confiro.",
          "Antes de fechar errado, me chama.",
          "Tô quase saindo, então fala logo."
        ]
      };
    }

    if (pathname.startsWith("/produtos")) {
      return {
        quick: ["mais barato", "ver promocoes", "comparar", "adicionar ao carrinho"],
        teasers: [
          "Rolando a tela sem rumo, já vi tudo.",
          "Usa o filtro logo em vez de sofrer.",
          "Tá achando caro ou só tá indeciso mesmo?",
          "Clica aqui que eu peneiro isso pra você.",
          "Vai ficar descendo isso até amanhã?",
          "Você já passou do que queria faz tempo.",
          "Abre isso logo, eu acho a peça pra você.",
          "Se ficar só olhando eu não bato meta.",
          "Fala logo, nem você sabe o que tá caçando.",
          "Muita opção, né? Me chama que eu resolvo."
        ]
      };
    }

    return {
      quick: ["ver promocoes", "mais barato", "ver detalhes", "adicionar ao carrinho"],
      teasers: [
        "Não clica aqui não, namoral.",
        "Vai entrar ou ficar só olhando a vitrine?",
        "Fala aí o que você quer de uma vez.",
        "Dá um clique aqui pra eu mostrar serviço.",
        "Tô aqui, infelizmente. Posso ajudar?",
        "Se abrir o chat meu chefe não enche.",
        "Vai rolar compra hoje ou tá sem limite?",
        "Fala rápido que minha pausa é daqui a pouco.",
        "Mais gente entrando. Diz logo o que precisa.",
        "Tá perdido logo na primeira página?",
        "Abre aí pra eu fingir que tô trabalhando.",
        "Quero ver quando vão me pagar.",
        "Mais um que veio só olhar.",
        "Tô aqui ainda. Infelizmente.",
        "Fala o que você quer que eu vejo."
      ]
    };
  }, [pathname]);
  const quickActions =
    serverQuickActions?.pathname === pathname ? serverQuickActions.actions : context.quick;
  const suppressPurchaseOverlay =
    isPurchasePage && open && (isKeyboardOpen || composerFocused || isLandscapeMobile);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    lastScrollAtRef.current = Date.now();
    const sessionSeen = window.sessionStorage.getItem(HINT_SESSION_SEEN_KEY) === "1";
    const saved = Number(window.localStorage.getItem(HINT_STORAGE_KEY) ?? "");
    nextHintAtRef.current =
      !sessionSeen
        ? Date.now() + HINT_INITIAL_DELAY_MIN_MS + Math.round(Math.random() * HINT_INITIAL_DELAY_SPREAD_MS)
        : Number.isFinite(saved) && saved > Date.now()
        ? saved
        : Date.now() + HINT_INITIAL_DELAY_MIN_MS + Math.round(Math.random() * HINT_INITIAL_DELAY_SPREAD_MS);
  }, [context.quick]);

  useEffect(() => {
    function onScroll() {
      lastScrollAtRef.current = Date.now();
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateViewportState = () => {
      if (typeof window === "undefined") {
        return;
      }

      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const keyboardLikelyOpen = Boolean(viewport && window.innerHeight - viewport.height > 140);
      setIsKeyboardOpen(keyboardLikelyOpen);
      setIsLandscapeMobile(width <= 940 && width > height);
      setIsMobileViewport(width <= 760 || (coarsePointer && width <= 1100));
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    window.visualViewport?.addEventListener("resize", updateViewportState);

    return () => {
      window.removeEventListener("resize", updateViewportState);
      window.visualViewport?.removeEventListener("resize", updateViewportState);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open || isPurchasePage) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const idleEnough = now - lastScrollAtRef.current > (isHomePage ? 700 : 1400);

      if (idleEnough && now >= nextHintAtRef.current) {
        const firstIndex = Math.floor(Math.random() * context.teasers.length);
        const firstLine = context.teasers[firstIndex];
        const availableSecondary = context.teasers.filter((line, index) => index !== firstIndex);
        const shouldStack = availableSecondary.length > 0 && Math.random() > (isHomePage ? 0.72 : 0.84);
        const nextLines = shouldStack
          ? [firstLine, availableSecondary[Math.floor(Math.random() * availableSecondary.length)]]
          : [firstLine];
        setTeaserLines(nextLines);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(HINT_SESSION_SEEN_KEY, "1");
        }
        setNudgeTick((value) => value + 1);
        const nextWindow = now + (isHomePage ? HOME_TEASER_COOLDOWN_MS : BROWSE_TEASER_COOLDOWN_MS);
        nextHintAtRef.current = nextWindow;
        window.localStorage.setItem(HINT_STORAGE_KEY, String(nextWindow));
      }
    }, 1800);

    return () => window.clearInterval(interval);
  }, [context.teasers, isHomePage, isPurchasePage, open]);

  useEffect(() => {
    if (teaserLines.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTeaserLines([]);
    }, TEASER_VISIBLE_MS);

    return () => window.clearTimeout(timeout);
  }, [teaserLines]);

  function scrollToBottom(force = false) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    if (force || shouldStickToBottomRef.current) {
      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior: force ? "auto" : "smooth"
      });
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    scrollToBottom(true);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    scrollToBottom();
  }, [messages, loading, open]);

  async function addOne(productId: string) {
    setCartLoadingId(productId);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    setCartLoadingId("");

    if (response.status === 401) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Pra enfiar item no carrinho pelo chat eu preciso do teu login antes. Faz isso e eu retomo sem voce repetir a novela.",
          note: "login necessario",
          source: "fallback",
          fallbackReason: "auth_required"
        }
      ]);
      savePendingCartAction({
        productId,
        quantity: 1,
        pathname,
        source: "chat"
      });
      window.setTimeout(() => {
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      }, 500);
      return;
    }

    const data = await response.json();
    setMessages((current) => [
      ...current,
        {
          role: "assistant",
        content: response.ok
          ? "Pronto. Joguei 1 no carrinho. Finalmente."
          : data.error ?? "Nao consegui adicionar agora. Que fase.",
        note: response.ok ? "acao executada" : "falha de carrinho",
        source: "fallback"
      }
    ]);
  }

  useEffect(() => {
    if (replayedIntentRef.current) {
      return;
    }

    const pendingAction = readPendingCartAction();

    if (!pendingAction || pendingAction.source !== "chat" || pendingAction.pathname !== pathname) {
      return;
    }

    replayedIntentRef.current = true;

    void (async () => {
      setCartLoadingId(pendingAction.productId);
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: pendingAction.productId,
          quantity: pendingAction.quantity
        })
      });
      setCartLoadingId("");
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        clearPendingCartAction();
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: "Voltei do login e retomei a acao. Item no carrinho. Ja era pra estar feito antes.",
            note: "acao retomada apos login",
            source: "fallback"
          }
        ]);
        router.refresh();
        return;
      }

      if (response.status !== 401) {
        clearPendingCartAction();
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data && typeof data.error === "string"
              ? data.error
              : "Nao consegui retomar a adicao ao carrinho agora. Lindo.",
          note: "falha ao retomar acao",
          source: "fallback"
        }
      ]);
    })();
  }, [pathname, router]);

  function chunkDelayMs(chunk: string, index: number) {
    const base = Math.min(CHUNK_PAUSE_MAX_MS, CHUNK_PAUSE_MIN_MS + chunk.length * 12);
    return Math.max(CHUNK_PAUSE_MIN_MS, base + index * 120);
  }

  async function playAssistantChunks(input: {
    chunks: string[];
    products: ChatProductCard[];
    source: "ai" | "fallback";
    fallbackReason?: string;
    note?: string;
  }) {
    const chunks = input.chunks.filter((chunk) => chunk.trim().length > 0);

    if (chunks.length === 0) {
      return;
    }

    for (const [index, chunk] of chunks.entries()) {
      await new Promise((resolve) => window.setTimeout(resolve, chunkDelayMs(chunk, index)));
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: chunk,
          products: index === chunks.length - 1 ? input.products : [],
          source: input.source,
          fallbackReason: input.fallbackReason,
          note: index === chunks.length - 1 ? input.note : undefined
        }
      ]);
    }
  }

  async function runSendMessage(content: string, options?: { skipUserEcho?: boolean }) {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    const now = interactionNow();
    lastUserMessageAtRef.current = now;
    if (!options?.skipUserEcho) {
      setMessages((current) => [...current, { role: "user", content: trimmed }]);
    }
    setLoading(true);
    setLoadingLabel("vendo no sistema");

    let response: Response;
    let data: ChatApiResponse;
    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          currentProductSlug: currentProductSlug(pathname),
          pathname
        }),
        signal: controller.signal
      });
      data = (await response.json()) as ChatApiResponse;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setLoading(false);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "A rede morreu no meio do caminho. Tenta de novo se ainda quiser comprar.",
          source: "fallback",
          fallbackReason: "network_error",
          note: "erro de rede"
        }
      ]);
      return;
    }
    requestAbortRef.current = null;

    if (data.sessionId) {
      setSessionId(String(data.sessionId));
    }

    if (Array.isArray(data.quickActions) && data.quickActions.length > 0) {
      setServerQuickActions({ pathname, actions: data.quickActions.map(String) });
    }

    const fallbackReason = typeof data.fallbackReason === "string" ? data.fallbackReason : undefined;
    const source = data.source === "ai" ? "ai" : "fallback";
    if (typeof data.typingStatus === "string" && data.typingStatus.trim().length > 0) {
      setLoadingLabel(data.typingStatus);
    }
    const note =
      !response.ok
        ? "chat com instabilidade"
        : source === "ai"
          ? "assistente 10PILA"
          : fallbackReason === "missing_provider"
            ? "base da loja"
            : fallbackReason === "provider_error"
              ? "resposta segura da loja"
              : fallbackReason === "auth_required"
                ? "login necessario"
                : fallbackReason === "no_product_match"
                  ? "produto nao encontrado"
                  : "resposta da loja";

    const products = Array.isArray(data.products) ? (data.products as ChatProductCard[]) : [];
    const chunks =
      Array.isArray(data.replyChunks) && data.replyChunks.length > 0
        ? data.replyChunks.map(String)
        : [
            typeof data.reply === "string"
              ? data.reply
              : !response.ok
                ? "Deu ruim aqui no chat. Tenta de novo em instantes."
                : "Buguei. Pelo menos nao inventei resposta."
          ];

    await playAssistantChunks({
      chunks,
      products,
      source,
      fallbackReason,
      note
    });

    setLoading(false);
  }

  function scheduleSend(content: string) {
    pendingMessageRef.current = content;

    if (sendDebounceRef.current) {
      window.clearTimeout(sendDebounceRef.current);
    }

    sendDebounceRef.current = window.setTimeout(() => {
      const next = pendingMessageRef.current;
      pendingMessageRef.current = null;
      sendDebounceRef.current = null;

      if (next) {
        void runSendMessage(next, { skipUserEcho: true });
      }
    }, MESSAGE_DEBOUNCE_MS);
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    const now = interactionNow();
    const flooding = loading || now - lastUserMessageAtRef.current < FLOOD_THRESHOLD_MS;

    if (flooding) {
      requestAbortRef.current?.abort();
      requestAbortRef.current = null;
      setLoading(false);
      setMessages((current) => [
        ...current,
        { role: "user", content: trimmed },
        {
          role: "assistant",
          content:
            now - lastUserMessageAtRef.current < FLOOD_THRESHOLD_MS
              ? "Se ficar mandando mensagem picada eu perco o raciocínio."
              : "Calma, deixa eu ler uma coisa de cada vez.",
          source: "fallback",
          fallbackReason: "deterministic",
          note: "uma de cada vez"
        }
      ]);
      scheduleSend(trimmed);
      return;
    }

    await runSendMessage(trimmed);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const content = String(form.get("message") ?? "");

    event.currentTarget.reset();
    await sendMessage(content);
  }

  function setNextHintCooldown(durationMs: number) {
    const nextAt = Date.now() + durationMs;
    nextHintAtRef.current = nextAt;
    window.localStorage.setItem(HINT_STORAGE_KEY, String(nextAt));
  }

  function openChat() {
    setOpen(true);
    setTeaserLines([]);
    setNextHintCooldown(POST_OPEN_COOLDOWN_MS);
  }

  function closeChat() {
    setOpen(false);
    setNextHintCooldown(POST_CLOSE_COOLDOWN_MS);
  }

  function toggleChat() {
    if (open) {
      closeChat();
      return;
    }

    openChat();
  }

  function onQuickAction(action: string) {
    const lastAssistantWithProducts = [...messages]
      .reverse()
      .find((message) => message.role === "assistant" && message.products?.length);

    if (action === "ir para o carrinho") {
      router.push("/carrinho");
      return;
    }

    if (action === "adicionar ao carrinho" || action === "adicionar 1 ao carrinho") {
      const firstProduct = lastAssistantWithProducts?.products?.[0];

      if (firstProduct) {
        void addOne(firstProduct.id);
        return;
      }

      void sendMessage("adicionar 1 ao carrinho");
      return;
    }

    if (action === "fechar pedido") {
      router.push("/checkout");
      return;
    }

    if (action === "revisar o carrinho") {
      router.push("/carrinho");
      return;
    }

    void sendMessage(action);
  }

  return (
    <div
      className="pointer-events-none fixed right-0 z-50 grid justify-items-end gap-3"
      style={{
        bottom:
          isKeyboardOpen || composerFocused
            ? "max(8px, calc(env(safe-area-inset-bottom) + 4px))"
            : isPurchasePage
              ? "max(146px, calc(env(safe-area-inset-bottom) + 126px))"
              : "max(16px, calc(env(safe-area-inset-bottom) + 12px))"
      }}
    >
      <AnimatePresence>
        {open ? (
          !suppressPurchaseOverlay ? (
          <>
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Fechar chat clicando fora"
            className="fixed inset-0 pointer-events-auto bg-transparent"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={closeChat}
            transition={{ duration: 0.18, ease: "easeOut" }}
            type="button"
          />
          <motion.section
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`chat-shell pointer-events-auto mr-4 grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[rgba(10,12,15,0.95)] shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
              isPurchasePage
                ? "h-[min(450px,calc(100vh-210px))] w-[min(360px,calc(100vw-18px))]"
                : "h-[min(560px,calc(100vh-110px))] w-[min(410px,calc(100vw-24px))]"
            } ${isMobileViewport ? "chat-shell-mobile" : ""} ${isLandscapeMobile ? "chat-shell-landscape-mobile max-h-[calc(100vh-18px)] w-[min(360px,calc(100vw-10px))] mr-1" : "max-sm:mr-2 max-sm:h-[min(72vh,calc(100vh-92px))] max-sm:w-[min(390px,calc(100vw-12px))]"}`}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="chat-head flex items-center justify-between gap-3 border-b border-[var(--line)] p-3">
              <div className="flex items-center gap-3">
                <div className="grid size-14 place-items-center rounded-full bg-black/40 ring-1 ring-[var(--line)]">
                  <AssistantMascot compact thinking={loading} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <BrandLogo variant="symbol" className="w-8" />
                    <div>
                      <p className="text-sm font-black">PilaBot</p>
                      <p className="chat-head-subtitle text-xs text-[var(--muted)]">
                        {isPurchasePage ? "vendedor entediado de fechamento" : "vendedor mal pago e entediado"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="chip bg-black/40 text-[var(--accent)]">
                      <BoltIcon className="size-3.5" />
                      assistente 10PILA
                    </span>
                  </div>
                </div>
              </div>
              <button className="btn secondary min-h-9 px-3" onClick={closeChat} type="button">
                Fechar
              </button>
            </div>

            <div
              ref={scrollerRef}
              className="grid content-start gap-3 overflow-y-auto p-4 text-sm"
              onScroll={(event) => {
                const element = event.currentTarget;
                const distanceToBottom =
                  element.scrollHeight - element.scrollTop - element.clientHeight;
                const nearBottom = distanceToBottom < 96;
                shouldStickToBottomRef.current = nearBottom;
                setShowScrollButton(!nearBottom);
              }}
            >
              {messages.length === 1 && !loading ? (
                <div className="chat-welcome-panel">
                  <div className="chat-welcome-art">
                    <BotSignalIllustration className="size-20" />
                  </div>
                  <div className="grid gap-2">
                    <p className="text-xs font-black uppercase text-[var(--accent-2)]">
                      assistente 10PILA
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {isPurchasePage
                        ? "Estou aqui pra destravar entrega, cupom, carrinho e fechamento. Ja que ninguem mais fez."
                        : "Posso achar link, comparar produto, puxar o mais barato ou encurtar teu caminho ate a compra."}
                    </p>
                  </div>
                </div>
              ) : null}
              {messages.map((message, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={
                    message.role === "user"
                      ? "chat-bubble-user ml-8 rounded-lg border border-[rgba(61,245,165,0.38)] bg-[rgba(18,64,49,0.96)] p-3 text-[#f7fbff] shadow-[0_12px_34px_rgba(0,0,0,0.32)]"
                      : "chat-bubble-assistant mr-8 rounded-lg border border-[rgba(85,200,255,0.34)] bg-[rgba(17,28,40,0.96)] p-3 text-[#f7fbff] shadow-[0_12px_34px_rgba(0,0,0,0.38)]"
                  }
                  initial={{ opacity: 0, y: 8, scale: 0.985 }}
                  key={`${message.role}-${index}`}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {message.note ? (
                    <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-[var(--accent-2)]">
                      {message.note}
                    </p>
                  ) : null}
                  <MessageContent content={message.content} />
                  {message.products?.length ? (
                    <div className="mt-3 grid gap-2">
                      {message.products.slice(0, 3).map((product, productIndex) => (
                        <motion.article
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="chat-product-card grid gap-2 rounded-lg border border-[var(--line)] bg-black/30 p-2"
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          key={product.id}
                          transition={{ delay: productIndex * 0.04, duration: 0.18, ease: "easeOut" }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.985 }}
                        >
                          <div className="flex gap-2">
                            <Image
                              alt=""
                              className="size-14 rounded-lg object-cover"
                              height={56}
                              src={product.imageUrl}
                              width={56}
                            />
                            <div>
                              <strong>{product.name}</strong>
                              <p className="text-xs text-[var(--muted)]">
                                {product.price} | estoque {product.stock}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a className="btn secondary min-h-9 px-3" href={product.url}>
                              Ver produto
                            </a>
                            <button
                              className="btn min-h-9 px-3"
                              disabled={cartLoadingId === product.id || product.stock <= 0}
                              onClick={() => addOne(product.id)}
                              type="button"
                            >
                              {cartLoadingId === product.id ? "..." : "Adicionar 1"}
                            </button>
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ))}
              {loading ? (
                <div className="chat-loading-row">
                  <span className="chat-loading-dots" aria-hidden="true">
                    <span className="chat-loading-dot" />
                    <span className="chat-loading-dot" />
                    <span className="chat-loading-dot" />
                  </span>
                  <span>{loadingLabel}</span>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <div className="grid gap-2 border-t border-[var(--line)] p-3">
              {showScrollButton ? (
                <button
                  className="quick-chip w-fit"
                  onClick={() => {
                    shouldStickToBottomRef.current = true;
                    setShowScrollButton(false);
                    scrollToBottom();
                  }}
                  type="button"
                >
                  voltar para o fim
                </button>
              ) : null}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickActions.map((action) => (
                  <button
                    className="quick-chip shrink-0"
                    key={action}
                    onClick={() => onQuickAction(action)}
                    type="button"
                  >
                    {action}
                  </button>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={onSubmit}>
                <input
                  className="input"
                  onBlur={() => setComposerFocused(false)}
                  onFocus={() => setComposerFocused(true)}
                  name="message"
                  placeholder="Fala o que voce quer comprar"
                />
                <button className="btn shrink-0" type="submit">
                  Enviar
                </button>
              </form>
            </div>
          </motion.section>
          </>
          ) : null
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {teaserLines.length > 0 && !open && !isPurchasePage && !isKeyboardOpen && !composerFocused ? (
          <motion.button
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="chat-hint-stack pointer-events-auto absolute bottom-16 right-12 grid justify-items-end gap-1.5 text-left max-sm:bottom-18 max-sm:right-8"
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            onClick={openChat}
            transition={{ duration: 0.22, ease: "easeOut" }}
            type="button"
          >
            {teaserLines.map((line, index) => (
              <span
                className={`chat-hint ${index === teaserLines.length - 1 ? "chat-hint-primary" : "chat-hint-secondary"}`}
                key={`${line}-${index}`}
              >
                <span className="block">{line}</span>
              </span>
            ))}
          </motion.button>
        ) : null}
      </AnimatePresence>

      <div
        className={`pointer-events-auto relative overflow-visible ${
          isPurchasePage && !open
            ? "mr-0 h-16 w-[68px] opacity-92"
            : "mr-1 h-28 w-[118px] max-sm:mr-0 max-sm:w-[108px]"
        } ${isKeyboardOpen || composerFocused ? "opacity-0 pointer-events-none" : ""}`}
      >
        <motion.div
          animate={{
            x: [-2, 0, -2],
            y: [0, -1, 0],
            rotate: [0, 0.8, 0, -0.8, 0]
          }}
          className="absolute bottom-[-2px] right-[-2px] max-sm:right-[-4px]"
          key={nudgeTick}
          transition={{ duration: 0.72, ease: "easeInOut" }}
        >
            <div className="relative">
            <div className="absolute inset-x-10 bottom-3 h-8 rounded-full bg-[rgba(61,245,165,0.12)] blur-2xl" />
            <div className={`${isPurchasePage && !open ? "translate-x-4 translate-y-5 scale-[0.56]" : "translate-x-1 translate-y-1"}`}>
              <AssistantMascot onClick={toggleChat} open={open} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
