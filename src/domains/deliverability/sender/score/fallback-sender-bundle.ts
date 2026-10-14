import * as text from "../../../../kit/text.js";

/** Where a fallback sender bundle is in its life cycle. */
export type FallbackSenderBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fallback sender bundle, with what the planners need to act on it. */
export class FallbackSenderBundle {
  code: string;
  title: string;
  quantity: number;
  weight: number;
  amount: number;
  status: FallbackSenderBundleStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    weight: number,
    amount: number,
    status: FallbackSenderBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.weight = weight;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackSenderBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackSenderBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sender bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback sender bundle"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.amount + this.weight) * 100) / 100;
  }

  copy(): FallbackSenderBundle {
    return new FallbackSenderBundle(this.code, this.title, this.quantity, this.weight, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback sender bundle in status new. */
export function newFallbackSenderBundle(code: string, title: string): FallbackSenderBundle {
  return new FallbackSenderBundle(code, title, 0, 0, 0, "new");
}
