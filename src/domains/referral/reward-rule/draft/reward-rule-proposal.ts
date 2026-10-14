import * as text from "../../../../kit/text.js";

/** Where a reward rule proposal is in its life cycle. */
export type RewardRuleProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule proposal as the reward rule team keeps it. */
export class RewardRuleProposal {
  code: string;
  title: string;
  bid: number;
  maximum: number;
  active: boolean;
  country: string;
  phone: string;
  capacity: number;
  status: RewardRuleProposalStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    maximum: number,
    active: boolean,
    country: string,
    phone: string,
    capacity: number,
    status: RewardRuleProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.maximum = maximum;
    this.active = active;
    this.country = country;
    this.phone = phone;
    this.capacity = capacity;
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

  canMoveTo(next: RewardRuleProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RewardRuleProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.maximum - this.bid) * 100) / 100;
  }

  copy(): RewardRuleProposal {
    return new RewardRuleProposal(
      this.code,
      this.title,
      this.bid,
      this.maximum,
      this.active,
      this.country,
      this.phone,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward rule proposal in status planned. */
export function newRewardRuleProposal(code: string, title: string): RewardRuleProposal {
  return new RewardRuleProposal(code, title, 0, 0, false, "", "", 0, "planned");
}
