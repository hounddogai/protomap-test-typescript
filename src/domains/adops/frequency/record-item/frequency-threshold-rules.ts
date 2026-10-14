import { FrequencyThreshold } from "./frequency-threshold.js";

/** A rule a frequency threshold must pass. Check returns its problems, or none. */
export interface FrequencyThresholdRule {
  check(item: FrequencyThreshold): string[];
}

export class FrequencyThresholdCodeLengthRule implements FrequencyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyThresholdExpiresAtRangeRule implements FrequencyThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyThreshold): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyThresholdTagsLimitRule implements FrequencyThresholdRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FrequencyThreshold): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class FrequencyThresholdVisibleGuardRule implements FrequencyThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FrequencyThreshold): string[] {
    if (item.visible && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class FrequencyThresholdCodePrefixRule implements FrequencyThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyThresholdRequiredSourceRule implements FrequencyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyThreshold): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency threshold. */
export class FrequencyThresholdValidator {
  rules: FrequencyThresholdRule[];

  constructor(rules: FrequencyThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyThreshold[]): Map<string, string[]> {
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

export function defaultFrequencyThresholdValidator(): FrequencyThresholdValidator {
  return new FrequencyThresholdValidator(
    [
      new FrequencyThresholdCodeLengthRule(16),
      new FrequencyThresholdExpiresAtRangeRule(120, 255),
      new FrequencyThresholdTagsLimitRule(1000, ["regional", "capped"]),
      new FrequencyThresholdVisibleGuardRule(255),
      new FrequencyThresholdCodePrefixRule("ACM"),
      new FrequencyThresholdRequiredSourceRule("frequency threshold needs this field"),
    ],
  );
}
