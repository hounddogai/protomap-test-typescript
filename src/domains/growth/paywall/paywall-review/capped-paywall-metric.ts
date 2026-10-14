import * as text from "../../../../kit/text.js";

/** Where a capped paywall metric is in its life cycle. */
export type CappedPaywallMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped paywall metric. Its code is unique within a tenant. */
export class CappedPaywallMetric {
  code: string;
  title: string;
  amount: number;
  score: number;
  bid: number;
  summary: string;
  audienceId: string;
  discount: number;
  status: CappedPaywallMetricStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    score: number,
    bid: number,
    summary: string,
    audienceId: string,
    discount: number,
    status: CappedPaywallMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.score = score;
    this.bid = bid;
    this.summary = summary;
    this.audienceId = audienceId;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPaywallMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPaywallMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped paywall metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped paywall metric"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.bid - this.discount) * 100) / 100;
  }

  copy(): CappedPaywallMetric {
    return new CappedPaywallMetric(
      this.code,
      this.title,
      this.amount,
      this.score,
      this.bid,
      this.summary,
      this.audienceId,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped paywall metric in status proposed. */
export function newCappedPaywallMetric(code: string, title: string): CappedPaywallMetric {
  return new CappedPaywallMetric(code, title, 0, 0, 0, "", "", 0, "proposed");
}
