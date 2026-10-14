import * as text from "../../../../kit/text.js";

/** Where a default bid rule summary is in its life cycle. */
export type DefaultBidRuleSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default bid rule summary, with what the planners need to act on it. */
export class DefaultBidRuleSummary {
  code: string;
  label: string;
  clicks: number;
  title: string;
  sequence: number;
  campaignRef: string;
  maximum: number;
  cost: number;
  startsAt: number;
  status: DefaultBidRuleSummaryStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    title: string,
    sequence: number,
    campaignRef: string,
    maximum: number,
    cost: number,
    startsAt: number,
    status: DefaultBidRuleSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.title = title;
    this.sequence = sequence;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.cost = cost;
    this.startsAt = startsAt;
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

  canMoveTo(next: DefaultBidRuleSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultBidRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default bid rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.maximum - this.clicks) * 100) / 100;
  }

  copy(): DefaultBidRuleSummary {
    return new DefaultBidRuleSummary(
      this.code,
      this.label,
      this.clicks,
      this.title,
      this.sequence,
      this.campaignRef,
      this.maximum,
      this.cost,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default bid rule summary in status planned. */
export function newDefaultBidRuleSummary(code: string, label: string): DefaultBidRuleSummary {
  return new DefaultBidRuleSummary(code, label, 0, "", 0, "", 0, 0, 0, "planned");
}
