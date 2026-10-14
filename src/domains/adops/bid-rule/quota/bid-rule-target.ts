import * as text from "../../../../kit/text.js";

/** Where a bid rule target is in its life cycle. */
export type BidRuleTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A bid rule target. Its code is unique within a tenant. */
export class BidRuleTarget {
  code: string;
  title: string;
  externalRef: string;
  margin: number;
  graceDays: number;
  variant: string;
  notes: string;
  revision: number;
  batchSize: number;
  status: BidRuleTargetStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    margin: number,
    graceDays: number,
    variant: string,
    notes: string,
    revision: number,
    batchSize: number,
    status: BidRuleTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.margin = margin;
    this.graceDays = graceDays;
    this.variant = variant;
    this.notes = notes;
    this.revision = revision;
    this.batchSize = batchSize;
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

  canMoveTo(next: BidRuleTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BidRuleTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedTotal(): number {
    return Math.round(this.revision * this.graceDays * 100) / 100;
  }

  copy(): BidRuleTarget {
    return new BidRuleTarget(
      this.code,
      this.title,
      this.externalRef,
      this.margin,
      this.graceDays,
      this.variant,
      this.notes,
      this.revision,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bid rule target in status planned. */
export function newBidRuleTarget(code: string, title: string): BidRuleTarget {
  return new BidRuleTarget(code, title, "", 0, 0, "", "", 0, 0, "planned");
}
