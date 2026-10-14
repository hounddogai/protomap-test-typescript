import { LegacyPacingPlan } from "./legacy-pacing-plan.js";

/** A rule a legacy pacing plan must pass. Check returns its problems, or none. */
export interface LegacyPacingPlanRule {
  check(item: LegacyPacingPlan): string[];
}

export class LegacyPacingPlanOwnerIdLengthRule implements LegacyPacingPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingPlan): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingPlanCapacityRangeRule implements LegacyPacingPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPacingPlan): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyPacingPlanRequiredOwnerIdRule implements LegacyPacingPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPacingPlan): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPacingPlanDescriptionLengthRule implements LegacyPacingPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingPlan): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy pacing plan. */
export class LegacyPacingPlanValidator {
  rules: LegacyPacingPlanRule[];

  constructor(rules: LegacyPacingPlanRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPacingPlan): string[] {
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

  requireValid(item: LegacyPacingPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPacingPlan[]): Map<string, string[]> {
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

export function defaultLegacyPacingPlanValidator(): LegacyPacingPlanValidator {
  return new LegacyPacingPlanValidator(
    [
      new LegacyPacingPlanOwnerIdLengthRule(16),
      new LegacyPacingPlanCapacityRangeRule(255, 3600),
      new LegacyPacingPlanRequiredOwnerIdRule("legacy pacing plan needs this field"),
      new LegacyPacingPlanDescriptionLengthRule(32),
    ],
  );
}
