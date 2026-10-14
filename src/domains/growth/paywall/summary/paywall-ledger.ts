import * as text from "../../../../kit/text.js";

/** Where a paywall ledger is in its life cycle. */
export type PaywallLedgerStatus = "created" | "validated" | "published" | "retired";

/** One paywall ledger, with what the planners need to act on it. */
export class PaywallLedger {
  code: string;
  title: string;
  source: string;
  priority: number;
  category: string;
  endsAt: number;
  active: boolean;
  visible: boolean;
  margin: number;
  name: string;
  status: PaywallLedgerStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    priority: number,
    category: string,
    endsAt: number,
    active: boolean,
    visible: boolean,
    margin: number,
    name: string,
    status: PaywallLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.priority = priority;
    this.category = category;
    this.endsAt = endsAt;
    this.active = active;
    this.visible = visible;
    this.margin = margin;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.priority - this.endsAt) * 100) / 100;
  }

  copy(): PaywallLedger {
    return new PaywallLedger(
      this.code,
      this.title,
      this.source,
      this.priority,
      this.category,
      this.endsAt,
      this.active,
      this.visible,
      this.margin,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a paywall ledger in status created. */
export function newPaywallLedger(code: string, title: string): PaywallLedger {
  return new PaywallLedger(code, title, "", 0, "", 0, false, false, 0, "", "created");
}
