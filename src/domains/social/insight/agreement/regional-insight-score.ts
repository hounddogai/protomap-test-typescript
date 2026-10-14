import * as text from "../../../../kit/text.js";

/** Where a regional insight score is in its life cycle. */
export type RegionalInsightScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional insight score as the insight team keeps it. */
export class RegionalInsightScore {
  code: string;
  label: string;
  endsAt: number;
  timezone: string;
  audienceId: string;
  batchSize: number;
  budget: number;
  bid: number;
  campaignRef: string;
  status: RegionalInsightScoreStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    timezone: string,
    audienceId: string,
    batchSize: number,
    budget: number,
    bid: number,
    campaignRef: string,
    status: RegionalInsightScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.budget = budget;
    this.bid = bid;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: RegionalInsightScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalInsightScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional insight score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.budget + this.endsAt) * 100) / 100;
  }

  copy(): RegionalInsightScore {
    return new RegionalInsightScore(
      this.code,
      this.label,
      this.endsAt,
      this.timezone,
      this.audienceId,
      this.batchSize,
      this.budget,
      this.bid,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional insight score in status draft. */
export function newRegionalInsightScore(code: string, label: string): RegionalInsightScore {
  return new RegionalInsightScore(code, label, 0, "", "", 0, 0, 0, "", "draft");
}
