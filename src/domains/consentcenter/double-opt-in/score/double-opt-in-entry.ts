import * as text from "../../../../kit/text.js";

/** Where a double opt in entry is in its life cycle. */
export type DoubleOptInEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One double opt in entry, with what the planners need to act on it. */
export class DoubleOptInEntry {
  code: string;
  name: string;
  graceDays: number;
  cost: number;
  locale: string;
  expiresAt: number;
  ownerId: string;
  retries: number;
  amount: number;
  durationMinutes: number;
  discount: number;
  status: DoubleOptInEntryStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    cost: number,
    locale: string,
    expiresAt: number,
    ownerId: string,
    retries: number,
    amount: number,
    durationMinutes: number,
    discount: number,
    status: DoubleOptInEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.cost = cost;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.retries = retries;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
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

  canMoveTo(next: DoubleOptInEntryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DoubleOptInEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.durationMinutes * this.discount * 100) / 100;
  }

  copy(): DoubleOptInEntry {
    return new DoubleOptInEntry(
      this.code,
      this.name,
      this.graceDays,
      this.cost,
      this.locale,
      this.expiresAt,
      this.ownerId,
      this.retries,
      this.amount,
      this.durationMinutes,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a double opt in entry in status new. */
export function newDoubleOptInEntry(code: string, name: string): DoubleOptInEntry {
  return new DoubleOptInEntry(code, name, 0, 0, "", 0, "", 0, 0, 0, 0, "new");
}
