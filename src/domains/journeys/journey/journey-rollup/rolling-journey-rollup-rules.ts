import { RollingJourneyRollup } from "./rolling-journey-rollup.js";

/** A rule a rolling journey rollup must pass. Check returns its problems, or none. */
export interface RollingJourneyRollupRule {
  check(item: RollingJourneyRollup): string[];
}

export class RollingJourneyRollupRequiredAudienceIdRule implements RollingJourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyRollup): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneyRollupRequiredLabelRule implements RollingJourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneyRollupAudienceIdLengthRule implements RollingJourneyRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneyRollup): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingJourneyRollupBudgetRangeRule implements RollingJourneyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneyRollup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling journey rollup. */
export class RollingJourneyRollupValidator {
  rules: RollingJourneyRollupRule[];

  constructor(rules: RollingJourneyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneyRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingJourneyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneyRollup[]): Map<string, string[]> {
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

export function defaultRollingJourneyRollupValidator(): RollingJourneyRollupValidator {
  return new RollingJourneyRollupValidator(
    [
      new RollingJourneyRollupRequiredAudienceIdRule("rolling journey rollup needs a value"),
      new RollingJourneyRollupRequiredLabelRule("rolling journey rollup needs this field"),
      new RollingJourneyRollupAudienceIdLengthRule(32),
      new RollingJourneyRollupBudgetRangeRule(1.7, 1948.1),
    ],
  );
}
