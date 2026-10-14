import * as text from "../../../../kit/text.js";

/** Where a reward rule rollup is in its life cycle. */
export type RewardRuleRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reward rule rollup as the reward rule team keeps it. */
export class RewardRuleRollup {
  code: string;
  title: string;
  amount: number;
  audienceId: string;
  sequence: number;
  status: RewardRuleRollupStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    audienceId: string,
    sequence: number,
    status: RewardRuleRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.sequence - this.amount) * 100) / 100;
  }

  copy(): RewardRuleRollup {
    return new RewardRuleRollup(this.code, this.title, this.amount, this.audienceId, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward rule rollup in status idle. */
export function newRewardRuleRollup(code: string, title: string): RewardRuleRollup {
  return new RewardRuleRollup(code, title, 0, "", 0, "idle");
}
