import * as text from "../../../../kit/text.js";

/** Where a reward bundle is in its life cycle. */
export type RewardBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reward bundle as the reward team keeps it. */
export class RewardBundle {
  code: string;
  label: string;
  utmSource: string;
  unit: string;
  cohort: string;
  updatedAt: number;
  sequence: number;
  impressions: number;
  notes: string;
  createdAt: number;
  quantity: number;
  status: RewardBundleStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    unit: string,
    cohort: string,
    updatedAt: number,
    sequence: number,
    impressions: number,
    notes: string,
    createdAt: number,
    quantity: number,
    status: RewardBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.unit = unit;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.impressions = impressions;
    this.notes = notes;
    this.createdAt = createdAt;
    this.quantity = quantity;
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

  canMoveTo(next: RewardBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RewardBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round((this.quantity + this.updatedAt) * 100) / 100;
  }

  copy(): RewardBundle {
    return new RewardBundle(
      this.code,
      this.label,
      this.utmSource,
      this.unit,
      this.cohort,
      this.updatedAt,
      this.sequence,
      this.impressions,
      this.notes,
      this.createdAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a reward bundle in status draft. */
export function newRewardBundle(code: string, label: string): RewardBundle {
  return new RewardBundle(code, label, "", "", "", 0, 0, 0, "", 0, 0, "draft");
}
