import * as text from "../../../../kit/text.js";
import { RollingChallengeThreshold } from "./rolling-challenge-threshold.js";

/** A rule a rolling challenge threshold must pass. Check returns its problems, or none. */
export interface RollingChallengeThresholdRule {
  check(item: RollingChallengeThreshold): string[];
}

export class RollingChallengeThresholdAllowedTitleRule implements RollingChallengeThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingChallengeThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class RollingChallengeThresholdBatchSizeRangeRule implements RollingChallengeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingChallengeThreshold): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingChallengeThresholdLocaleLengthRule implements RollingChallengeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingChallengeThreshold): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingChallengeThresholdCodePrefixRule implements RollingChallengeThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingChallengeThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling challenge threshold. */
export class RollingChallengeThresholdValidator {
  rules: RollingChallengeThresholdRule[];

  constructor(rules: RollingChallengeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RollingChallengeThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingChallengeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingChallengeThreshold[]): Map<string, string[]> {
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

export function defaultRollingChallengeThresholdValidator(): RollingChallengeThresholdValidator {
  return new RollingChallengeThresholdValidator(
    [
      new RollingChallengeThresholdAllowedTitleRule([]),
      new RollingChallengeThresholdBatchSizeRangeRule(16, 255),
      new RollingChallengeThresholdLocaleLengthRule(86400),
      new RollingChallengeThresholdCodePrefixRule("OPS"),
    ],
  );
}
