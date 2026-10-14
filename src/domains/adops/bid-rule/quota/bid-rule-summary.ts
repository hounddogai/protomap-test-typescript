import * as text from "../../../../kit/text.js";

/** Where a bid rule summary is in its life cycle. */
export type BidRuleSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a bid rule summary and its current status. */
export class BidRuleSummary {
  code: string;
  name: string;
  journeyId: string;
  updatedAt: number;
  weight: number;
  conversionRate: number;
  label: string;
  status: BidRuleSummaryStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    updatedAt: number,
    weight: number,
    conversionRate: number,
    label: string,
    status: BidRuleSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.conversionRate = conversionRate;
    this.label = label;
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

  canMoveTo(next: BidRuleSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round(this.updatedAt * this.conversionRate * 100) / 100;
  }

  copy(): BidRuleSummary {
    return new BidRuleSummary(
      this.code,
      this.name,
      this.journeyId,
      this.updatedAt,
      this.weight,
      this.conversionRate,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bid rule summary in status new. */
export function newBidRuleSummary(code: string, name: string): BidRuleSummary {
  return new BidRuleSummary(code, name, "", 0, 0, 0, "", "new");
}
