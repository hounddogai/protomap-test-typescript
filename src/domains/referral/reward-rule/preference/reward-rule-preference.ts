/**
 * The reward rule preference records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule preference is in its life cycle. */
export type RewardRulePreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a reward rule preference and its current status. */
export class RewardRulePreference {
  code: string;
  name: string;
  source: string;
  sequence: number;
  startsAt: number;
  tags: string[];
  priority: number;
  checksum: string;
  country: string;
  threshold: number;
  status: RewardRulePreferenceStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    sequence: number,
    startsAt: number,
    tags: string[],
    priority: number,
    checksum: string,
    country: string,
    threshold: number,
    status: RewardRulePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.tags = tags;
    this.priority = priority;
    this.checksum = checksum;
    this.country = country;
    this.threshold = threshold;
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

  canMoveTo(next: RewardRulePreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RewardRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.startsAt + this.sequence) * 100) / 100;
  }

  copy(): RewardRulePreference {
    return new RewardRulePreference(
      this.code,
      this.name,
      this.source,
      this.sequence,
      this.startsAt,
      this.tags,
      this.priority,
      this.checksum,
      this.country,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reward rule preference in status planned. */
export function newRewardRulePreference(code: string, name: string): RewardRulePreference {
  return new RewardRulePreference(code, name, "", 0, 0, [], 0, "", "", 0, "planned");
}
