import * as text from "../../../../kit/text.js";

/** Where a activation entry is in its life cycle. */
export type ActivationEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** One activation entry, with what the planners need to act on it. */
export class ActivationEntry {
  code: string;
  name: string;
  sendAt: number;
  quantity: number;
  ceiling: number;
  status: ActivationEntryStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    quantity: number,
    ceiling: number,
    status: ActivationEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.sendAt + this.ceiling) * 100) / 100;
  }

  copy(): ActivationEntry {
    return new ActivationEntry(this.code, this.name, this.sendAt, this.quantity, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation entry in status requested. */
export function newActivationEntry(code: string, name: string): ActivationEntry {
  return new ActivationEntry(code, name, 0, 0, 0, "requested");
}
