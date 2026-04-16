"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Fala, humano do setup. Pergunta produto, promo ou pedido que eu consulto na fonte."
    }
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const content = String(form.get("message") ?? "").trim();

    if (!content) {
      return;
    }

    event.currentTarget.reset();
    setMessages((current) => [...current, { role: "user", content }]);
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: content })
    });
    const data = await response.json();
    setLoading(false);

    if (data.sessionId) {
      setSessionId(data.sessionId);
    }

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: data.reply ?? "Buguei com classe, mas nao inventei moda. Tenta de novo."
      }
    ]);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 grid justify-items-end gap-3">
      {open ? (
        <section className="panel grid h-[440px] w-[min(360px,calc(100vw-32px))] grid-rows-[1fr_auto] overflow-hidden">
          <div className="grid gap-3 overflow-y-auto p-4 text-sm">
            {messages.map((message, index) => (
              <p
                className={
                  message.role === "user"
                    ? "ml-8 rounded-lg bg-[var(--accent)] p-3 text-black"
                    : "mr-8 rounded-lg bg-black/40 p-3"
                }
                key={`${message.role}-${index}`}
              >
                <MessageContent content={message.content} />
              </p>
            ))}
            {loading ? <p className="text-[var(--muted)]">Consultando a matrix...</p> : null}
          </div>
          <form className="flex gap-2 border-t border-[var(--line)] p-3" onSubmit={onSubmit}>
            <input
              className="input"
              name="message"
              placeholder="Pergunte sobre produtos ou pedidos"
            />
            <button className="btn" type="submit">
              Enviar
            </button>
          </form>
        </section>
      ) : null}
      <button className="btn" onClick={() => setOpen((value) => !value)}>
        {open ? "Fechar chat" : "Chat IA"}
      </button>
    </div>
  );
}
