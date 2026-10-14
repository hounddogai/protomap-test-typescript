import * as text from "../../../../kit/text.js";

/** Where a ticket view tier is in its life cycle. */
export type TicketViewTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A ticket view tier as the ticket view team keeps it. */
export class TicketViewTier {
  code: string;
  title: string;
  ratio: number;
  category: string;
  amount: number;
  phone: string;
  retries: number;
  cost: number;
  status: TicketViewTierStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    category: string,
    amount: number,
    phone: string,
    retries: number,
    cost: number,
    status: TicketViewTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.category = category;
    this.amount = amount;
    this.phone = phone;
    this.retries = retries;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TicketViewTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round((this.retries + this.ratio) * 100) / 100;
  }

  copy(): TicketViewTier {
    return new TicketViewTier(
      this.code,
      this.title,
      this.ratio,
      this.category,
      this.amount,
      this.phone,
      this.retries,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a ticket view tier in status planned. */
export function newTicketViewTier(code: string, title: string): TicketViewTier {
  return new TicketViewTier(code, title, 0, "", 0, "", 0, 0, "planned");
}
