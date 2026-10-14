import * as text from "../../../../kit/text.js";

/** Where a reward rule mapping is in its life cycle. */
export type RewardRuleMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reward rule mapping. Its code is unique within a tenant. */
export class RewardRuleMapping {
  code: string;
  label: string;
  notes: string;
  category: string;
  windowDays: number;
  retries: number;
  startsAt: number;
  attempts: number;
  endsAt: number;
  cohort: string;
  status: RewardRuleMappingStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    category: string,
    windowDays: number,
    retries: number,
    startsAt: number,
    attempts: number,
    endsAt: number,
    cohort: string,
    status: RewardRuleMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.category = category;
    this.windowDays = windowDays;
    this.retries = retries;
    this.startsAt = startsAt;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.cohort = cohort;
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

  canMoveTo(next: RewardRuleMappingStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RewardRuleMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"reward rule mapping"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.endsAt + this.retries) * 100) / 100;
  }

  copy(): RewardRuleMapping {
    return new RewardRuleMapping(
      this.code,
      this.label,
      this.notes,
      this.category,
      this.windowDays,
      this.retries,
      this.startsAt,
      this.attempts,
      this.endsAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a reward rule mapping in status open. */
export function newRewardRuleMapping(code: string, label: string): RewardRuleMapping {
  return new RewardRuleMapping(code, label, "", "", 0, 0, 0, 0, 0, "", "open");
}
