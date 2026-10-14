/**
 * The reward rule slot records of referral's reward rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule slot is in its life cycle. */
export type RewardRuleSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reward rule slot as the reward rule team keeps it. */
export class RewardRuleSlot {
  code: string;
  label: string;
  contactEmail: string;
  checksum: string;
  bid: number;
  source: string;
  budget: number;
  tags: string[];
  frequencyCap: number;
  description: string;
  batchSize: number;
  status: RewardRuleSlotStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    checksum: string,
    bid: number,
    source: string,
    budget: number,
    tags: string[],
    frequencyCap: number,
    description: string,
    batchSize: number,
    status: RewardRuleSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.bid = bid;
    this.source = source;
    this.budget = budget;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.batchSize = batchSize;
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

  canMoveTo(next: RewardRuleSlotStatus): boolean {
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
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RewardRuleSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.bid - this.budget) * 100) / 100;
  }

  copy(): RewardRuleSlot {
    return new RewardRuleSlot(
      this.code,
      this.label,
      this.contactEmail,
      this.checksum,
      this.bid,
      this.source,
      this.budget,
      this.tags,
      this.frequencyCap,
      this.description,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reward rule slot in status new. */
export function newRewardRuleSlot(code: string, label: string): RewardRuleSlot {
  return new RewardRuleSlot(code, label, "", "", 0, "", 0, [], 0, "", 0, "new");
}
