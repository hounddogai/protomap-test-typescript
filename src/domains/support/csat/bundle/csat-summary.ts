import * as text from "../../../../kit/text.js";

/** Where a csat summary is in its life cycle. */
export type CsatSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A csat summary. Its code is unique within a tenant. */
export class CsatSummary {
  code: string;
  label: string;
  reviewer: string;
  bid: number;
  priority: number;
  attempts: number;
  maximum: number;
  pinned: boolean;
  conversionRate: number;
  score: number;
  status: CsatSummaryStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    bid: number,
    priority: number,
    attempts: number,
    maximum: number,
    pinned: boolean,
    conversionRate: number,
    score: number,
    status: CsatSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.bid = bid;
    this.priority = priority;
    this.attempts = attempts;
    this.maximum = maximum;
    this.pinned = pinned;
    this.conversionRate = conversionRate;
    this.score = score;
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

  canMoveTo(next: CsatSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.maximum * this.priority * 100) / 100;
  }

  copy(): CsatSummary {
    return new CsatSummary(
      this.code,
      this.label,
      this.reviewer,
      this.bid,
      this.priority,
      this.attempts,
      this.maximum,
      this.pinned,
      this.conversionRate,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat summary in status new. */
export function newCsatSummary(code: string, label: string): CsatSummary {
  return new CsatSummary(code, label, "", 0, 0, 0, 0, false, 0, 0, "new");
}
