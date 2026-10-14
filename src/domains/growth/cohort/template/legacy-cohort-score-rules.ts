import * as text from "../../../../kit/text.js";
import { LegacyCohortScore } from "./legacy-cohort-score.js";

/** A rule a legacy cohort score must pass. Check returns its problems, or none. */
export interface LegacyCohortScoreRule {
  check(item: LegacyCohortScore): string[];
}

export class LegacyCohortScoreNameLengthRule implements LegacyCohortScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCohortScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCohortScoreRetriesRangeRule implements LegacyCohortScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCohortScore): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyCohortScoreRequiredCodeRule implements LegacyCohortScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCohortScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCohortScoreWindowDaysRangeRule implements LegacyCohortScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCohortScore): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyCohortScoreCodePrefixRule implements LegacyCohortScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyCohortScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyCohortScoreAllowedCodeRule implements LegacyCohortScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyCohortScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a legacy cohort score. */
export class LegacyCohortScoreValidator {
  rules: LegacyCohortScoreRule[];

  constructor(rules: LegacyCohortScoreRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCohortScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyCohortScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCohortScore[]): Map<string, string[]> {
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

export function defaultLegacyCohortScoreValidator(): LegacyCohortScoreValidator {
  return new LegacyCohortScoreValidator(
    [
      new LegacyCohortScoreNameLengthRule(1000),
      new LegacyCohortScoreRetriesRangeRule(16, 3600),
      new LegacyCohortScoreRequiredCodeRule("legacy cohort score needs an entry"),
      new LegacyCohortScoreWindowDaysRangeRule(16, 255),
      new LegacyCohortScoreCodePrefixRule("OPS"),
      new LegacyCohortScoreAllowedCodeRule(["batched"]),
    ],
  );
}
