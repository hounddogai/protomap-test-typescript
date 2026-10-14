import * as text from "../../../../kit/text.js";

/** Where a journey rule is in its life cycle. */
export type JourneyRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One journey rule, with what the planners need to act on it. */
export class JourneyRule {
  code: string;
  label: string;
  weight: number;
  graceDays: number;
  floorValue: number;
  priority: number;
  status: JourneyRuleStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    graceDays: number,
    floorValue: number,
    priority: number,
    status: JourneyRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.priority = priority;
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

  canMoveTo(next: JourneyRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: JourneyRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.graceDays + this.floorValue) * 100) / 100;
  }

  copy(): JourneyRule {
    return new JourneyRule(
      this.code,
      this.label,
      this.weight,
      this.graceDays,
      this.floorValue,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey rule in status planned. */
export function newJourneyRule(code: string, label: string): JourneyRule {
  return new JourneyRule(code, label, 0, 0, 0, 0, "planned");
}
