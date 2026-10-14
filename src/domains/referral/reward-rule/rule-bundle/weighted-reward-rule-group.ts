import * as text from "../../../../kit/text.js";

/** Where a weighted reward rule group is in its life cycle. */
export type WeightedRewardRuleGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One weighted reward rule group, with what the planners need to act on it. */
export class WeightedRewardRuleGroup {
  code: string;
  label: string;
  startsAt: number;
  attributes: Map<string, string>;
  active: boolean;
  budget: number;
  status: WeightedRewardRuleGroupStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    attributes: Map<string, string>,
    active: boolean,
    budget: number,
    status: WeightedRewardRuleGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.attributes = attributes;
    this.active = active;
    this.budget = budget;
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

  canMoveTo(next: WeightedRewardRuleGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRewardRuleGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward rule group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"weighted reward rule group"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.budget - this.startsAt) * 100) / 100;
  }

  copy(): WeightedRewardRuleGroup {
    return new WeightedRewardRuleGroup(
      this.code,
      this.label,
      this.startsAt,
      this.attributes,
      this.active,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted reward rule group in status planned. */
export function newWeightedRewardRuleGroup(code: string, label: string): WeightedRewardRuleGroup {
  return new WeightedRewardRuleGroup(code, label, 0, new Map<string, string>(), false, 0, "planned");
}
