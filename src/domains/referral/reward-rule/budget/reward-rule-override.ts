import * as text from "../../../../kit/text.js";

/** Where a reward rule override is in its life cycle. */
export type RewardRuleOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** One reward rule override, with what the planners need to act on it. */
export class RewardRuleOverride {
  code: string;
  title: string;
  openRate: number;
  region: string;
  revision: number;
  channel: string;
  pinned: boolean;
  priority: number;
  status: RewardRuleOverrideStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    region: string,
    revision: number,
    channel: string,
    pinned: boolean,
    priority: number,
    status: RewardRuleOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.region = region;
    this.revision = revision;
    this.channel = channel;
    this.pinned = pinned;
    this.priority = priority;
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

  canMoveTo(next: RewardRuleOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RewardRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round(this.openRate * this.revision * 100) / 100;
  }

  copy(): RewardRuleOverride {
    return new RewardRuleOverride(
      this.code,
      this.title,
      this.openRate,
      this.region,
      this.revision,
      this.channel,
      this.pinned,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward rule override in status new. */
export function newRewardRuleOverride(code: string, title: string): RewardRuleOverride {
  return new RewardRuleOverride(code, title, 0, "", 0, "", false, 0, "new");
}
