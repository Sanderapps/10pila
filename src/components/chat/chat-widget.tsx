"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { BoltIcon } from "@/components/icons";
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
};

const HINT_STORAGE_KEY = "10pila-chat-next-hint-at";
const HINT_DELAY_MIN_MS = 8000;
const HINT_DELAY_SPREAD_MS = 7000;
const POST_CLOSE_COOLDOWN_MS = 1000 * 60 * 18;
const POST_OPEN_COOLDOWN_MS = 1000 * 60 * 30;

function currentProductSlug(pathname: string) {
  const match = pathname.match(/^\/produtos\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function MessageContent({ content }: { content: string }) {
  return (
    <>
      {content.split("\n").map((line, lineIndex) => (
        <span className="block" key={`${line}-${lineIndex}`}>
          {line.split(/(https?:\/\/[^\s]+)/g).map((part, partIndex) =>
            part.startsWith("http") ? (
              <a
                className="font-bold text-[#60a5fa] underline underline-offset-2"
                href={part}
                key={`${part}-${partIndex}`}
                rel="noreferrer"
                target="_blank"
              >
                {part}
              </a>
            ) : (
              <span key={`${part}-${partIndex}`}>{part}</span>
            )
          )}
        </span>
      ))}
    </>
  );
}

export function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [nudgeTick, setNudgeTick] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Fala, humano do setup. Pergunta produto, promo ou pedido que eu consulto na fonte."
    }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverQuickActions, setServerQuickActions] = useState<{
    pathname: string;
    actions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cartLoadingId, setCartLoadingId] = useState("");
  const nextHintAtRef = useRef(0);
  const lastScrollAtRef = useRef(0);

  const context = useMemo(() => {
    if (pathname.startsWith("/produtos/")) {
      return {
        quick: ["comparar esse produto", "ver detalhes", "adicionar ao carrinho"],
        hints: [
          "Quer comparar esse produto?",
          "Posso ver se esse compensa",
          "Quer levar 1 sem drama?"
        ]
      };
    }

    if (pathname.startsWith("/carrinho")) {
      return {
        quick: ["ir para o carrinho", "fechar pedido", "ver promocoes"],
        hints: ["Quer fechar esse pedido?", "Posso revisar esse carrinho", "Partiu checkout?"]
      };
    }

    if (pathname.startsWith("/produtos")) {
      return {
        quick: ["mais barato", "ver promocoes", "comparar"],
        hints: [
          "Te ajudo a achar o mais barato",
          "Tem promo no radar",
          "Quer filtrar o melhor custo-beneficio?"
        ]
      };
    }

    return {
      quick: ["ver promocoes", "mais barato", "ver detalhes"],
      hints: [
        "Posso te ajudar a escolher",
        "Tem promo hoje no radar",
        "Quer montar um setup mais esperto?"
      ]
    };
  }, [pathname]);
  const quickActions =
    serverQuickActions?.pathname === pathname ? serverQuickActions.actions : context.quick;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    lastScrollAtRef.current = Date.now();
    const saved = Number(window.localStorage.getItem(HINT_STORAGE_KEY) ?? "");
    nextHintAtRef.current =
      Number.isFinite(saved) && saved > Date.now()
        ? saved
        : Date.now() + HINT_DELAY_MIN_MS + Math.round(Math.random() * HINT_DELAY_SPREAD_MS);
  }, [context.quick]);

  useEffect(() => {
    function onScroll() {
      lastScrollAtRef.current = Date.now();
      setHint("");
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const idleEnough = now - lastScrollAtRef.current > 2600;

      if (idleEnough && now >= nextHintAtRef.current) {
        const nextHint = context.hints[Math.floor(Math.random() * context.hints.length)];
        setHint(nextHint);
        setNudgeTick((value) => value + 1);
        const nextWindow = now + POST_CLOSE_COOLDOWN_MS;
        nextHintAtRef.current = nextWindow;
        window.localStorage.setItem(HINT_STORAGE_KEY, String(nextWindow));
      }
    }, 1800);

    return () => window.clearInterval(interval);
  }, [context.hints, open]);

  async function addOne(productId: string) {
    setCartLoadingId(productId);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    setCartLoadingId("");

    if (response.status === 401) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    const data = await response.json();
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: response.ok
          ? "Adicionei 1 no carrinho. Setup recebeu upgrade."
          : data.error ?? "Nao consegui adicionar agora."
      }
    ]);
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed || loading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: trimmed,
        currentProductSlug: currentProductSlug(pathname)
      })
    });
    const data = await response.json();
    setLoading(false);

    if (data.sessionId) {
      setSessionId(data.sessionId);
    }

    if (Array.isArray(data.quickActions) && data.quickActions.length > 0) {
      setServerQuickActions({ pathname, actions: data.quickActions });
    }

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: data.reply ?? "Buguei com classe, mas nao inventei moda. Tenta de novo.",
        products: Array.isArray(data.products) ? data.products : []
      }
    ]);
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
    setHint("");
    setNextHintCooldown(POST_OPEN_COOLDOWN_MS);
  }

  function closeChat() {
    setOpen(false);
    setNextHintCooldown(POST_CLOSE_COOLDOWN_MS);
  }

  function onQuickAction(action: string) {
    if (action === "ir para o carrinho") {
      router.push("/carrinho");
      return;
    }

    if (action === "adicionar ao carrinho") {
      void sendMessage("adicionar ao carrinho");
      return;
    }

    if (action === "fechar pedido") {
      router.push("/checkout");
      return;
    }

    void sendMessage(action);
  }

  return (
    <div
      className="pointer-events-none fixed right-0 z-50 grid justify-items-end gap-3"
      style={{ bottom: "max(16px, calc(env(safe-area-inset-bottom) + 12px))" }}
    >
      <AnimatePresence>
        {open ? (
          <motion.section
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="chat-shell pointer-events-auto mr-4 grid h-[min(560px,calc(100vh-110px))] w-[min(410px,calc(100vw-24px))] grid-rows-[auto_1fr_auto] overflow-hidden rounded-[8px] border border-[var(--line)] bg-[rgba(10,12,15,0.95)] shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl max-sm:mr-3"
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
                  <BrandLogo variant="compact" className="scale-[0.88] origin-left" />
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="chip bg-black/40 text-[var(--accent)]">
                      <BoltIcon className="size-3.5" />
                      vendedor tech
                    </span>
                    <span className="text-xs text-[var(--muted)]">banco na mao</span>
                  </div>
                </div>
              </div>
              <button className="btn secondary min-h-9 px-3" onClick={closeChat} type="button">
                Fechar
              </button>
            </div>

            <div className="grid content-start gap-3 overflow-y-auto p-4 text-sm">
              {messages.map((message, index) => (
                <div
                  className={
                    message.role === "user"
                      ? "chat-bubble-user ml-8 rounded-lg bg-[var(--accent)] p-3 text-black"
                      : "chat-bubble-assistant mr-8 rounded-lg bg-black/40 p-3"
                  }
                  key={`${message.role}-${index}`}
                >
                  <MessageContent content={message.content} />
                  {message.products?.length ? (
                    <div className="mt-3 grid gap-2">
                      {message.products.slice(0, 3).map((product) => (
                        <article
                          className="chat-product-card grid gap-2 rounded-lg border border-[var(--line)] bg-black/30 p-2"
                          key={product.id}
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
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {loading ? (
                <div className="chat-loading-row">
                  <span className="chat-loading-dot" />
                  <span>Consultando Gemini + banco...</span>
                </div>
              ) : null}
            </div>

            <div className="grid gap-2 border-t border-[var(--line)] p-3">
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
                  name="message"
                  placeholder="Produto, promo ou pedido"
                />
                <button className="btn" disabled={loading} type="submit">
                  Enviar
                </button>
              </form>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-auto relative mr-0 h-28 w-[112px] overflow-hidden max-sm:w-[102px]">
        <AnimatePresence>
          {hint ? (
            <motion.button
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="chat-hint absolute bottom-20 right-16 max-w-[220px] rounded-[8px] border border-[var(--line)] bg-[rgba(8,10,14,0.96)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] shadow-[0_16px_40px_rgba(0,0,0,0.38)]"
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              onClick={openChat}
              transition={{ duration: 0.18, ease: "easeOut" }}
              type="button"
            >
              <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-normal text-[var(--accent)]">
                <BoltIcon className="size-3" />
                IA 10PILA
              </span>
              {hint}
            </motion.button>
          ) : null}
        </AnimatePresence>

        <motion.div
          animate={{
            x: [-2, 0, -2],
            y: [0, -1, 0],
            rotate: [0, 0.8, 0, -0.8, 0]
          }}
          className="absolute bottom-[-4px] right-[-10px] max-sm:right-[-12px]"
          key={nudgeTick}
          transition={{ duration: 0.72, ease: "easeInOut" }}
        >
          <div className="relative">
            <div className="absolute inset-x-10 bottom-3 h-8 rounded-full bg-[rgba(61,245,165,0.12)] blur-2xl" />
            <div className="translate-x-1 translate-y-1">
              <AssistantMascot onClick={openChat} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
