/**
 * The reward rule threshold records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule threshold is in its life cycle. */
export type RewardRuleThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reward rule threshold. Its code is unique within a tenant. */
export class RewardRuleThreshold {
  code: string;
  label: string;
  contactEmail: string;
  region: string;
  notes: string;
  rate: number;
  batchSize: number;
  createdAt: number;
  version: number;
  quantity: number;
  status: RewardRuleThresholdStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    region: string,
    notes: string,
    rate: number,
    batchSize: number,
    createdAt: number,
    version: number,
    quantity: number,
    status: RewardRuleThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.region = region;
    this.notes = notes;
    this.rate = rate;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.version = version;
    this.quantity = quantity;
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

  canMoveTo(next: RewardRuleThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"reward rule threshold"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.rate + this.version) * 100) / 100;
  }

  copy(): RewardRuleThreshold {
    return new RewardRuleThreshold(
      this.code,
      this.label,
      this.contactEmail,
      this.region,
      this.notes,
      this.rate,
      this.batchSize,
      this.createdAt,
      this.version,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward rule threshold in status new. */
export function newRewardRuleThreshold(code: string, label: string): RewardRuleThreshold {
  return new RewardRuleThreshold(code, label, "", "", "", 0, 0, 0, 0, 0, "new");
}
