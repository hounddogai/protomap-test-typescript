import * as text from "../../../../kit/text.js";

/** Where a reward rule milestone is in its life cycle. */
export type RewardRuleMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule milestone as the reward rule team keeps it. */
export class RewardRuleMilestone {
  code: string;
  title: string;
  endsAt: number;
  rate: number;
  channel: string;
  minimum: number;
  currency: string;
  budget: number;
  locale: string;
  pinned: boolean;
  audienceId: string;
  status: RewardRuleMilestoneStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    rate: number,
    channel: string,
    minimum: number,
    currency: string,
    budget: number,
    locale: string,
    pinned: boolean,
    audienceId: string,
    status: RewardRuleMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.rate = rate;
    this.channel = channel;
    this.minimum = minimum;
    this.currency = currency;
    this.budget = budget;
    this.locale = locale;
    this.pinned = pinned;
    this.audienceId = audienceId;
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

  canMoveTo(next: RewardRuleMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.minimum + this.endsAt) * 100) / 100;
  }

  copy(): RewardRuleMilestone {
    return new RewardRuleMilestone(
      this.code,
      this.title,
      this.endsAt,
      this.rate,
      this.channel,
      this.minimum,
      this.currency,
      this.budget,
      this.locale,
      this.pinned,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward rule milestone in status planned. */
export function newRewardRuleMilestone(code: string, title: string): RewardRuleMilestone {
  return new RewardRuleMilestone(code, title, 0, 0, "", 0, "", 0, "", false, "", "planned");
}
