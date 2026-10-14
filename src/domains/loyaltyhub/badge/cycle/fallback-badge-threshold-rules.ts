import { FallbackBadgeThreshold } from "./fallback-badge-threshold.js";

/** A rule a fallback badge threshold must pass. Check returns its problems, or none. */
export interface FallbackBadgeThresholdRule {
  check(item: FallbackBadgeThreshold): string[];
}

export class FallbackBadgeThresholdCostRangeRule implements FallbackBadgeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBadgeThreshold): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackBadgeThresholdTitleLengthRule implements FallbackBadgeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBadgeThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBadgeThresholdRequiredTitleRule implements FallbackBadgeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBadgeThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBadgeThresholdSegmentLengthRule implements FallbackBadgeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBadgeThreshold): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBadgeThresholdRequiredSegmentRule implements FallbackBadgeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBadgeThreshold): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback badge threshold. */
export class FallbackBadgeThresholdValidator {
  rules: FallbackBadgeThresholdRule[];

  constructor(rules: FallbackBadgeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBadgeThreshold): string[] {
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

  requireValid(item: FallbackBadgeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBadgeThreshold[]): Map<string, string[]> {
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

export function defaultFallbackBadgeThresholdValidator(): FallbackBadgeThresholdValidator {
  return new FallbackBadgeThresholdValidator(
    [
      new FallbackBadgeThresholdCostRangeRule(4.1, 70.3),
      new FallbackBadgeThresholdTitleLengthRule(255),
      new FallbackBadgeThresholdRequiredTitleRule("fallback badge threshold needs a value"),
      new FallbackBadgeThresholdSegmentLengthRule(3600),
      new FallbackBadgeThresholdRequiredSegmentRule("fallback badge threshold needs a value"),
    ],
  );
}
