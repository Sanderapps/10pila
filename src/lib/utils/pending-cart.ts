"use client";

const PENDING_CART_KEY = "10pila-pending-cart";

export type PendingCartAction = {
  productId: string;
  quantity: number;
  pathname: string;
  source: "product-page" | "chat";
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readPendingCartAction(): PendingCartAction | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(PENDING_CART_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PendingCartAction>;

    if (
      typeof parsed.productId !== "string" ||
      typeof parsed.quantity !== "number" ||
      typeof parsed.pathname !== "string" ||
      (parsed.source !== "product-page" && parsed.source !== "chat")
    ) {
      return null;
    }

    return parsed as PendingCartAction;
  } catch {
    return null;
  }
}

export function savePendingCartAction(action: PendingCartAction) {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(action));
}

export function clearPendingCartAction() {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.removeItem(PENDING_CART_KEY);
}
