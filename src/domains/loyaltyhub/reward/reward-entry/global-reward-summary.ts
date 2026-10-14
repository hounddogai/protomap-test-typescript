import * as text from "../../../../kit/text.js";

/** Where a global reward summary is in its life cycle. */
export type GlobalRewardSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global reward summary and its current status. */
export class GlobalRewardSummary {
  code: string;
  title: string;
  label: string;
  region: string;
  attempts: number;
  startsAt: number;
  amount: number;
  minimum: number;
  bid: number;
  summary: string;
  status: GlobalRewardSummaryStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    region: string,
    attempts: number,
    startsAt: number,
    amount: number,
    minimum: number,
    bid: number,
    summary: string,
    status: GlobalRewardSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.region = region;
    this.attempts = attempts;
    this.startsAt = startsAt;
    this.amount = amount;
    this.minimum = minimum;
    this.bid = bid;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRewardSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRewardSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global reward summary"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.startsAt * this.bid * 100) / 100;
  }

  copy(): GlobalRewardSummary {
    return new GlobalRewardSummary(
      this.code,
      this.title,
      this.label,
      this.region,
      this.attempts,
      this.startsAt,
      this.amount,
      this.minimum,
      this.bid,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global reward summary in status draft. */
export function newGlobalRewardSummary(code: string, title: string): GlobalRewardSummary {
  return new GlobalRewardSummary(code, title, "", "", 0, 0, 0, 0, 0, "", "draft");
}
