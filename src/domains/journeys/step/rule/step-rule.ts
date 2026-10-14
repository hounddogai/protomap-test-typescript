/**
 * The step rule records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step rule is in its life cycle. */
export type StepRuleStatus = "created" | "validated" | "published" | "retired";

/** A step rule. Its code is unique within a tenant. */
export class StepRule {
  code: string;
  title: string;
  priority: number;
  impressions: number;
  unit: string;
  sequence: number;
  segment: string;
  status: StepRuleStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    impressions: number,
    unit: string,
    sequence: number,
    segment: string,
    status: StepRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.impressions = impressions;
    this.unit = unit;
    this.sequence = sequence;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepRuleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.priority + this.impressions) * 100) / 100;
  }

  copy(): StepRule {
    return new StepRule(
      this.code,
      this.title,
      this.priority,
      this.impressions,
      this.unit,
      this.sequence,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a step rule in status created. */
export function newStepRule(code: string, title: string): StepRule {
  return new StepRule(code, title, 0, 0, "", 0, "", "created");
}
