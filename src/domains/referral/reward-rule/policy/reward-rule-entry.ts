import * as text from "../../../../kit/text.js";

/** Where a reward rule entry is in its life cycle. */
export type RewardRuleEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reward rule entry as the reward rule team keeps it. */
export class RewardRuleEntry {
  code: string;
  name: string;
  journeyId: string;
  attempts: number;
  checksum: string;
  approved: boolean;
  threshold: number;
  priority: number;
  budget: number;
  archived: boolean;
  status: RewardRuleEntryStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    attempts: number,
    checksum: string,
    approved: boolean,
    threshold: number,
    priority: number,
    budget: number,
    archived: boolean,
    status: RewardRuleEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.attempts = attempts;
    this.checksum = checksum;
    this.approved = approved;
    this.threshold = threshold;
    this.priority = priority;
    this.budget = budget;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RewardRuleEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward rule entry"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.threshold * this.attempts * 100) / 100;
  }

  copy(): RewardRuleEntry {
    return new RewardRuleEntry(
      this.code,
      this.name,
      this.journeyId,
      this.attempts,
      this.checksum,
      this.approved,
      this.threshold,
      this.priority,
      this.budget,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rule entry in status open. */
export function newRewardRuleEntry(code: string, name: string): RewardRuleEntry {
  return new RewardRuleEntry(code, name, "", 0, "", false, 0, 0, 0, false, "open");
}
