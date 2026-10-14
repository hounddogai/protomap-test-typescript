import * as text from "../../../../kit/text.js";

/** Where a insight batch is in its life cycle. */
export type InsightBatchStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A insight batch as the insight team keeps it. */
export class InsightBatch {
  code: string;
  name: string;
  conversionRate: number;
  createdAt: number;
  amount: number;
  openRate: number;
  status: InsightBatchStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    createdAt: number,
    amount: number,
    openRate: number,
    status: InsightBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.amount = amount;
    this.openRate = openRate;
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

  canMoveTo(next: InsightBatchStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.openRate - this.createdAt) * 100) / 100;
  }

  copy(): InsightBatch {
    return new InsightBatch(
      this.code,
      this.name,
      this.conversionRate,
      this.createdAt,
      this.amount,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a insight batch in status open. */
export function newInsightBatch(code: string, name: string): InsightBatch {
  return new InsightBatch(code, name, 0, 0, 0, 0, "open");
}
