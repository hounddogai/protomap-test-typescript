import * as text from "../../../../kit/text.js";

/** Where a weighted reputation rule is in its life cycle. */
export type WeightedReputationRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted reputation rule and its current status. */
export class WeightedReputationRule {
  code: string;
  name: string;
  rate: number;
  summary: string;
  budget: number;
  startsAt: number;
  status: WeightedReputationRuleStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    summary: string,
    budget: number,
    startsAt: number,
    status: WeightedReputationRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.summary = summary;
    this.budget = budget;
    this.startsAt = startsAt;
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

  canMoveTo(next: WeightedReputationRuleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: WeightedReputationRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted reputation rule"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.startsAt + this.rate) * 100) / 100;
  }

  copy(): WeightedReputationRule {
    return new WeightedReputationRule(
      this.code,
      this.name,
      this.rate,
      this.summary,
      this.budget,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted reputation rule in status new. */
export function newWeightedReputationRule(code: string, name: string): WeightedReputationRule {
  return new WeightedReputationRule(code, name, 0, "", 0, 0, "new");
}
