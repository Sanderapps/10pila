"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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

function currentProductSlug() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const match = window.location.pathname.match(/^\/produtos\/([^/]+)/);
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
                className="font-bold text-[var(--accent-2)] underline"
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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Fala, humano do setup. Pergunta produto, promo ou pedido que eu consulto na fonte."
    }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState(["ver promocoes", "mais barato"]);
  const [loading, setLoading] = useState(false);
  const [cartLoadingId, setCartLoadingId] = useState("");

  async function addOne(productId: string) {
    setCartLoadingId(productId);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    setCartLoadingId("");

    if (response.status === 401) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
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
        currentProductSlug: currentProductSlug()
      })
    });
    const data = await response.json();
    setLoading(false);

    if (data.sessionId) {
      setSessionId(data.sessionId);
    }

    if (Array.isArray(data.quickActions)) {
      setQuickActions(data.quickActions);
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

  function onQuickAction(action: string) {
    if (action === "ir para o carrinho") {
      router.push("/carrinho");
      return;
    }

    void sendMessage(action);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 grid justify-items-end gap-3 max-sm:left-4">
      {open ? (
        <section className="panel grid h-[min(560px,calc(100vh-104px))] w-[min(390px,calc(100vw-32px))] grid-rows-[auto_1fr_auto] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-3">
            <div>
              <p className="text-sm font-black">10PILA bot</p>
              <p className="text-xs text-[var(--muted)]">vendedor tech com banco na mao</p>
            </div>
            <button className="btn secondary min-h-9 px-3" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>

          <div className="grid content-start gap-3 overflow-y-auto p-4 text-sm">
            {messages.map((message, index) => (
              <div
                className={
                  message.role === "user"
                    ? "ml-8 rounded-lg bg-[var(--accent)] p-3 text-black"
                    : "mr-8 rounded-lg bg-black/40 p-3"
                }
                key={`${message.role}-${index}`}
              >
                <MessageContent content={message.content} />
                {message.products?.length ? (
                  <div className="mt-3 grid gap-2">
                    {message.products.slice(0, 3).map((product) => (
                      <article
                        className="grid gap-2 rounded-lg border border-[var(--line)] bg-black/30 p-2"
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
            {loading ? <p className="text-[var(--muted)]">Consultando Gemini + banco...</p> : null}
          </div>

          <div className="grid gap-2 border-t border-[var(--line)] p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickActions.map((action) => (
                <button
                  className="chip shrink-0"
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
        </section>
      ) : null}
      <button className="btn" onClick={() => setOpen((value) => !value)}>
        {open ? "Fechar chat" : "Chat IA"}
      </button>
    </div>
  );
}
