import * as text from "../../../../kit/text.js";

/** Where a insight ledger is in its life cycle. */
export type InsightLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A insight ledger. Its code is unique within a tenant. */
export class InsightLedger {
  code: string;
  title: string;
  category: string;
  tags: string[];
  revision: number;
  frequencyCap: number;
  amount: number;
  status: InsightLedgerStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    tags: string[],
    revision: number,
    frequencyCap: number,
    amount: number,
    status: InsightLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.tags = tags;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.amount = amount;
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

  canMoveTo(next: InsightLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: InsightLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.frequencyCap - this.revision) * 100) / 100;
  }

  copy(): InsightLedger {
    return new InsightLedger(
      this.code,
      this.title,
      this.category,
      this.tags,
      this.revision,
      this.frequencyCap,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a insight ledger in status open. */
export function newInsightLedger(code: string, title: string): InsightLedger {
  return new InsightLedger(code, title, "", [], 0, 0, 0, "open");
}
