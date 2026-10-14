import * as text from "../../../../kit/text.js";

/** Where a fallback frequency cycle is in its life cycle. */
export type FallbackFrequencyCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback frequency cycle as the frequency team keeps it. */
export class FallbackFrequencyCycle {
  code: string;
  label: string;
  limit: number;
  pinned: boolean;
  endsAt: number;
  quantity: number;
  status: FallbackFrequencyCycleStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    pinned: boolean,
    endsAt: number,
    quantity: number,
    status: FallbackFrequencyCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackFrequencyCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackFrequencyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback frequency cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.quantity - this.limit) * 100) / 100;
  }

  copy(): FallbackFrequencyCycle {
    return new FallbackFrequencyCycle(
      this.code,
      this.label,
      this.limit,
      this.pinned,
      this.endsAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback frequency cycle in status draft. */
export function newFallbackFrequencyCycle(code: string, label: string): FallbackFrequencyCycle {
  return new FallbackFrequencyCycle(code, label, 0, false, 0, 0, "draft");
}
