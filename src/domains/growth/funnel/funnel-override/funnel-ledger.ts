import * as text from "../../../../kit/text.js";

/** Where a funnel ledger is in its life cycle. */
export type FunnelLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A funnel ledger. Its code is unique within a tenant. */
export class FunnelLedger {
  code: string;
  name: string;
  tags: string[];
  source: string;
  conversionRate: number;
  priority: number;
  attempts: number;
  externalRef: string;
  graceDays: number;
  budget: number;
  status: FunnelLedgerStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    source: string,
    conversionRate: number,
    priority: number,
    attempts: number,
    externalRef: string,
    graceDays: number,
    budget: number,
    status: FunnelLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.source = source;
    this.conversionRate = conversionRate;
    this.priority = priority;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.graceDays = graceDays;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FunnelLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.budget + this.conversionRate) * 100) / 100;
  }

  copy(): FunnelLedger {
    return new FunnelLedger(
      this.code,
      this.name,
      this.tags,
      this.source,
      this.conversionRate,
      this.priority,
      this.attempts,
      this.externalRef,
      this.graceDays,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a funnel ledger in status open. */
export function newFunnelLedger(code: string, name: string): FunnelLedger {
  return new FunnelLedger(code, name, [], "", 0, 0, 0, "", 0, 0, "open");
}
