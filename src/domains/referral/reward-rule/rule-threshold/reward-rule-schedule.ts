import * as text from "../../../../kit/text.js";

/** Where a reward rule schedule is in its life cycle. */
export type RewardRuleScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reward rule schedule. Its code is unique within a tenant. */
export class RewardRuleSchedule {
  code: string;
  name: string;
  contactEmail: string;
  amount: number;
  ceiling: number;
  margin: number;
  status: RewardRuleScheduleStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    amount: number,
    ceiling: number,
    margin: number,
    status: RewardRuleScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.ceiling = ceiling;
    this.margin = margin;
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

  canMoveTo(next: RewardRuleScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.ceiling + this.amount) * 100) / 100;
  }

  copy(): RewardRuleSchedule {
    return new RewardRuleSchedule(
      this.code,
      this.name,
      this.contactEmail,
      this.amount,
      this.ceiling,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rule schedule in status idle. */
export function newRewardRuleSchedule(code: string, name: string): RewardRuleSchedule {
  return new RewardRuleSchedule(code, name, "", 0, 0, 0, "idle");
}
