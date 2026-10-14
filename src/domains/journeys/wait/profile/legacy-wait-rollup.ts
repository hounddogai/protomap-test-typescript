import * as text from "../../../../kit/text.js";

/** Where a legacy wait rollup is in its life cycle. */
export type LegacyWaitRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a legacy wait rollup and its current status. */
export class LegacyWaitRollup {
  code: string;
  label: string;
  phone: string;
  quantity: number;
  threshold: number;
  windowDays: number;
  impressions: number;
  region: string;
  ratio: number;
  amount: number;
  status: LegacyWaitRollupStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    quantity: number,
    threshold: number,
    windowDays: number,
    impressions: number,
    region: string,
    ratio: number,
    amount: number,
    status: LegacyWaitRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.quantity = quantity;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.impressions = impressions;
    this.region = region;
    this.ratio = ratio;
    this.amount = amount;
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

  canMoveTo(next: LegacyWaitRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyWaitRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy wait rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy wait rollup"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.impressions * this.amount * 100) / 100;
  }

  copy(): LegacyWaitRollup {
    return new LegacyWaitRollup(
      this.code,
      this.label,
      this.phone,
      this.quantity,
      this.threshold,
      this.windowDays,
      this.impressions,
      this.region,
      this.ratio,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy wait rollup in status draft. */
export function newLegacyWaitRollup(code: string, label: string): LegacyWaitRollup {
  return new LegacyWaitRollup(code, label, "", 0, 0, 0, 0, "", 0, 0, "draft");
}
