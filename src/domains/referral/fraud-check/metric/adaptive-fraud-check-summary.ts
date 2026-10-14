import * as text from "../../../../kit/text.js";

/** Where a adaptive fraud check summary is in its life cycle. */
export type AdaptiveFraudCheckSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive fraud check summary as the fraud check team keeps it. */
export class AdaptiveFraudCheckSummary {
  code: string;
  label: string;
  pinned: boolean;
  attributes: Map<string, string>;
  budget: number;
  windowDays: number;
  priority: number;
  batchSize: number;
  status: AdaptiveFraudCheckSummaryStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    attributes: Map<string, string>,
    budget: number,
    windowDays: number,
    priority: number,
    batchSize: number,
    status: AdaptiveFraudCheckSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.attributes = attributes;
    this.budget = budget;
    this.windowDays = windowDays;
    this.priority = priority;
    this.batchSize = batchSize;
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

  canMoveTo(next: AdaptiveFraudCheckSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveFraudCheckSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive fraud check summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive fraud check summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.priority - this.budget) * 100) / 100;
  }

  copy(): AdaptiveFraudCheckSummary {
    return new AdaptiveFraudCheckSummary(
      this.code,
      this.label,
      this.pinned,
      this.attributes,
      this.budget,
      this.windowDays,
      this.priority,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive fraud check summary in status new. */
export function newAdaptiveFraudCheckSummary(code: string, label: string): AdaptiveFraudCheckSummary {
  return new AdaptiveFraudCheckSummary(code, label, false, new Map<string, string>(), 0, 0, 0, 0, "new");
}
