import * as text from "../../../../kit/text.js";

/** Where a weighted reward rule summary is in its life cycle. */
export type WeightedRewardRuleSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted reward rule summary. Its code is unique within a tenant. */
export class WeightedRewardRuleSummary {
  code: string;
  label: string;
  channel: string;
  clicks: number;
  unit: string;
  frequencyCap: number;
  expiresAt: number;
  floorValue: number;
  journeyId: string;
  batchSize: number;
  status: WeightedRewardRuleSummaryStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    clicks: number,
    unit: string,
    frequencyCap: number,
    expiresAt: number,
    floorValue: number,
    journeyId: string,
    batchSize: number,
    status: WeightedRewardRuleSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.clicks = clicks;
    this.unit = unit;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.batchSize = batchSize;
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

  canMoveTo(next: WeightedRewardRuleSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
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

  moveTo(next: WeightedRewardRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"weighted reward rule summary"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.batchSize + this.clicks) * 100) / 100;
  }

  copy(): WeightedRewardRuleSummary {
    return new WeightedRewardRuleSummary(
      this.code,
      this.label,
      this.channel,
      this.clicks,
      this.unit,
      this.frequencyCap,
      this.expiresAt,
      this.floorValue,
      this.journeyId,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted reward rule summary in status open. */
export function newWeightedRewardRuleSummary(code: string, label: string): WeightedRewardRuleSummary {
  return new WeightedRewardRuleSummary(code, label, "", 0, "", 0, 0, 0, "", 0, "open");
}
