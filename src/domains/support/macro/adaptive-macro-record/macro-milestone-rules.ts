import { MacroMilestone } from "./macro-milestone.js";

/** A rule a macro milestone must pass. Check returns its problems, or none. */
export interface MacroMilestoneRule {
  check(item: MacroMilestone): string[];
}

export class MacroMilestoneTitleLengthRule implements MacroMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroMilestoneRatioRangeRule implements MacroMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroMilestone): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroMilestoneJourneyIdLengthRule implements MacroMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroMilestone): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro milestone. */
export class MacroMilestoneValidator {
  rules: MacroMilestoneRule[];

  constructor(rules: MacroMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: MacroMilestone): string[] {
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

  requireValid(item: MacroMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroMilestone[]): Map<string, string[]> {
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

export function defaultMacroMilestoneValidator(): MacroMilestoneValidator {
  return new MacroMilestoneValidator(
    [
      new MacroMilestoneTitleLengthRule(16),
      new MacroMilestoneRatioRangeRule(5.2, 1292.4),
      new MacroMilestoneJourneyIdLengthRule(1000),
    ],
  );
}
