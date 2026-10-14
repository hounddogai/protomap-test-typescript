import { SeasonalStreakQuota } from "./seasonal-streak-quota.js";

/** A rule a seasonal streak quota must pass. Check returns its problems, or none. */
export interface SeasonalStreakQuotaRule {
  check(item: SeasonalStreakQuota): string[];
}

export class SeasonalStreakQuotaRequiredSegmentRule implements SeasonalStreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalStreakQuota): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalStreakQuotaRequiredLabelRule implements SeasonalStreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalStreakQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalStreakQuotaImpressionsRangeRule implements SeasonalStreakQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalStreakQuota): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal streak quota. */
export class SeasonalStreakQuotaValidator {
  rules: SeasonalStreakQuotaRule[];

  constructor(rules: SeasonalStreakQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalStreakQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalStreakQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalStreakQuota[]): Map<string, string[]> {
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

export function defaultSeasonalStreakQuotaValidator(): SeasonalStreakQuotaValidator {
  return new SeasonalStreakQuotaValidator(
    [
      new SeasonalStreakQuotaRequiredSegmentRule("seasonal streak quota needs a value"),
      new SeasonalStreakQuotaRequiredLabelRule("seasonal streak quota needs a value"),
      new SeasonalStreakQuotaImpressionsRangeRule(16, 1000),
    ],
  );
}
