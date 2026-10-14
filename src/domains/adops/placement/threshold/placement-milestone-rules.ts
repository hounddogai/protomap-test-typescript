import { PlacementMilestone } from "./placement-milestone.js";

/** A rule a placement milestone must pass. Check returns its problems, or none. */
export interface PlacementMilestoneRule {
  check(item: PlacementMilestone): string[];
}

export class PlacementMilestoneCodeLengthRule implements PlacementMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementMilestoneNameLengthRule implements PlacementMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementMilestoneDurationMinutesRangeRule implements PlacementMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementMilestone): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementMilestoneRequiredCodeRule implements PlacementMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement milestone. */
export class PlacementMilestoneValidator {
  rules: PlacementMilestoneRule[];

  constructor(rules: PlacementMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementMilestone): string[] {
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

  requireValid(item: PlacementMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementMilestone[]): Map<string, string[]> {
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

export function defaultPlacementMilestoneValidator(): PlacementMilestoneValidator {
  return new PlacementMilestoneValidator(
    [
      new PlacementMilestoneCodeLengthRule(80),
      new PlacementMilestoneNameLengthRule(16),
      new PlacementMilestoneDurationMinutesRangeRule(32, 120),
      new PlacementMilestoneRequiredCodeRule("placement milestone needs a value"),
    ],
  );
}
