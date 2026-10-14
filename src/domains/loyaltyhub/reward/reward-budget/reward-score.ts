import * as text from "../../../../kit/text.js";

/** Where a reward score is in its life cycle. */
export type RewardScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a reward score and its current status. */
export class RewardScore {
  code: string;
  name: string;
  notes: string;
  bid: number;
  campaignRef: string;
  ceiling: number;
  clicks: number;
  summary: string;
  region: string;
  segment: string;
  floorValue: number;
  status: RewardScoreStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    bid: number,
    campaignRef: string,
    ceiling: number,
    clicks: number,
    summary: string,
    region: string,
    segment: string,
    floorValue: number,
    status: RewardScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.bid = bid;
    this.campaignRef = campaignRef;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.summary = summary;
    this.region = region;
    this.segment = segment;
    this.floorValue = floorValue;
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

  canMoveTo(next: RewardScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RewardScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.floorValue * this.bid * 100) / 100;
  }

  copy(): RewardScore {
    return new RewardScore(
      this.code,
      this.name,
      this.notes,
      this.bid,
      this.campaignRef,
      this.ceiling,
      this.clicks,
      this.summary,
      this.region,
      this.segment,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward score in status proposed. */
export function newRewardScore(code: string, name: string): RewardScore {
  return new RewardScore(code, name, "", 0, "", 0, 0, "", "", "", 0, "proposed");
}
