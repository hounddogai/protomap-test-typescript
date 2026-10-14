/**
 * The reward rule summary records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule summary is in its life cycle. */
export type RewardRuleSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule summary. Its code is unique within a tenant. */
export class RewardRuleSummary {
  code: string;
  title: string;
  locale: string;
  tags: string[];
  audienceId: string;
  createdAt: number;
  pinned: boolean;
  impressions: number;
  region: string;
  status: RewardRuleSummaryStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    tags: string[],
    audienceId: string,
    createdAt: number,
    pinned: boolean,
    impressions: number,
    region: string,
    status: RewardRuleSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.tags = tags;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.impressions = impressions;
    this.region = region;
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

  canMoveTo(next: RewardRuleSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RewardRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.createdAt * this.impressions * 100) / 100;
  }

  copy(): RewardRuleSummary {
    return new RewardRuleSummary(
      this.code,
      this.title,
      this.locale,
      this.tags,
      this.audienceId,
      this.createdAt,
      this.pinned,
      this.impressions,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reward rule summary in status planned. */
export function newRewardRuleSummary(code: string, title: string): RewardRuleSummary {
  return new RewardRuleSummary(code, title, "", [], "", 0, false, 0, "", "planned");
}
