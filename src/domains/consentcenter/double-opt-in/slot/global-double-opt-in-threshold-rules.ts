import { GlobalDoubleOptInThreshold } from "./global-double-opt-in-threshold.js";

/** A rule a global double opt in threshold must pass. Check returns its problems, or none. */
export interface GlobalDoubleOptInThresholdRule {
  check(item: GlobalDoubleOptInThreshold): string[];
}

export class GlobalDoubleOptInThresholdWindowDaysRangeRule implements GlobalDoubleOptInThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalDoubleOptInThreshold): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalDoubleOptInThresholdImpressionsRangeRule implements GlobalDoubleOptInThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalDoubleOptInThreshold): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalDoubleOptInThresholdRequiredNameRule implements GlobalDoubleOptInThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDoubleOptInThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global double opt in threshold. */
export class GlobalDoubleOptInThresholdValidator {
  rules: GlobalDoubleOptInThresholdRule[];

  constructor(rules: GlobalDoubleOptInThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDoubleOptInThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalDoubleOptInThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDoubleOptInThreshold[]): Map<string, string[]> {
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

export function defaultGlobalDoubleOptInThresholdValidator(): GlobalDoubleOptInThresholdValidator {
  return new GlobalDoubleOptInThresholdValidator(
    [
      new GlobalDoubleOptInThresholdWindowDaysRangeRule(80, 3600),
      new GlobalDoubleOptInThresholdImpressionsRangeRule(120, 3600),
      new GlobalDoubleOptInThresholdRequiredNameRule("global double opt in threshold needs a value"),
    ],
  );
}
