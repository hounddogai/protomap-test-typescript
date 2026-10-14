import * as text from "../../../../kit/text.js";
import { EscalationMilestone } from "./escalation-milestone.js";

/** A rule a escalation milestone must pass. Check returns its problems, or none. */
export interface EscalationMilestoneRule {
  check(item: EscalationMilestone): string[];
}

export class EscalationMilestoneAllowedNameRule implements EscalationMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class EscalationMilestoneWeightRangeRule implements EscalationMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationMilestone): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationMilestoneRequiredCodeRule implements EscalationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationMilestoneCostRangeRule implements EscalationMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationMilestone): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a escalation milestone. */
export class EscalationMilestoneValidator {
  rules: EscalationMilestoneRule[];

  constructor(rules: EscalationMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: EscalationMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationMilestone[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultEscalationMilestoneValidator(): EscalationMilestoneValidator {
  return new EscalationMilestoneValidator(
    [
      new EscalationMilestoneAllowedNameRule([]),
      new EscalationMilestoneWeightRangeRule(7.9, 3947.7),
      new EscalationMilestoneRequiredCodeRule("escalation milestone needs this field"),
      new EscalationMilestoneCostRangeRule(2, 1524.1),
    ],
  );
}
