import * as text from "../../../../kit/text.js";

/** Where a reward baseline is in its life cycle. */
export type RewardBaselineStatus = "created" | "validated" | "published" | "retired";

/** A reward baseline as the reward team keeps it. */
export class RewardBaseline {
  code: string;
  label: string;
  impressions: number;
  checksum: string;
  conversionRate: number;
  cost: number;
  reviewer: string;
  windowDays: number;
  ratio: number;
  sequence: number;
  contactEmail: string;
  status: RewardBaselineStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    checksum: string,
    conversionRate: number,
    cost: number,
    reviewer: string,
    windowDays: number,
    ratio: number,
    sequence: number,
    contactEmail: string,
    status: RewardBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.ratio = ratio;
    this.sequence = sequence;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reward baseline"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.ratio * this.impressions * 100) / 100;
  }

  copy(): RewardBaseline {
    return new RewardBaseline(
      this.code,
      this.label,
      this.impressions,
      this.checksum,
      this.conversionRate,
      this.cost,
      this.reviewer,
      this.windowDays,
      this.ratio,
      this.sequence,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward baseline in status created. */
export function newRewardBaseline(code: string, label: string): RewardBaseline {
  return new RewardBaseline(code, label, 0, "", 0, 0, "", 0, 0, 0, "", "created");
}
