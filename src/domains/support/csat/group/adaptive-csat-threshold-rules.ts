import { AdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

/** A rule a adaptive csat threshold must pass. Check returns its problems, or none. */
export interface AdaptiveCsatThresholdRule {
  check(item: AdaptiveCsatThreshold): string[];
}

export class AdaptiveCsatThresholdRequiredCodeRule implements AdaptiveCsatThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCsatThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCsatThresholdAudienceIdLengthRule implements AdaptiveCsatThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCsatThreshold): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCsatThresholdUpdatedAtRangeRule implements AdaptiveCsatThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCsatThreshold): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveCsatThresholdRequiredAudienceIdRule implements AdaptiveCsatThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCsatThreshold): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive csat threshold. */
export class AdaptiveCsatThresholdValidator {
  rules: AdaptiveCsatThresholdRule[];

  constructor(rules: AdaptiveCsatThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCsatThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveCsatThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCsatThreshold[]): Map<string, string[]> {
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

export function defaultAdaptiveCsatThresholdValidator(): AdaptiveCsatThresholdValidator {
  return new AdaptiveCsatThresholdValidator(
    [
      new AdaptiveCsatThresholdRequiredCodeRule("adaptive csat threshold needs a value"),
      new AdaptiveCsatThresholdAudienceIdLengthRule(80),
      new AdaptiveCsatThresholdUpdatedAtRangeRule(32, 120),
      new AdaptiveCsatThresholdRequiredAudienceIdRule("adaptive csat threshold needs this field"),
    ],
  );
}
