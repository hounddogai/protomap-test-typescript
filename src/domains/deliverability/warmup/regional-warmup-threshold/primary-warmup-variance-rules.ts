import * as text from "../../../../kit/text.js";
import { PrimaryWarmupVariance } from "./primary-warmup-variance.js";

/** A rule a primary warmup variance must pass. Check returns its problems, or none. */
export interface PrimaryWarmupVarianceRule {
  check(item: PrimaryWarmupVariance): string[];
}

export class PrimaryWarmupVarianceAttemptsRangeRule implements PrimaryWarmupVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryWarmupVariance): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryWarmupVarianceAllowedCodeRule implements PrimaryWarmupVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryWarmupVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PrimaryWarmupVarianceNameLengthRule implements PrimaryWarmupVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWarmupVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryWarmupVarianceRequiredNameRule implements PrimaryWarmupVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryWarmupVarianceRequiredLocaleRule implements PrimaryWarmupVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupVariance): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary warmup variance. */
export class PrimaryWarmupVarianceValidator {
  rules: PrimaryWarmupVarianceRule[];

  constructor(rules: PrimaryWarmupVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryWarmupVariance): string[] {
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

  requireValid(item: PrimaryWarmupVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryWarmupVariance[]): Map<string, string[]> {
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

export function defaultPrimaryWarmupVarianceValidator(): PrimaryWarmupVarianceValidator {
  return new PrimaryWarmupVarianceValidator(
    [
      new PrimaryWarmupVarianceAttemptsRangeRule(80, 255),
      new PrimaryWarmupVarianceAllowedCodeRule(["capped", "seasonal", "seasonal"]),
      new PrimaryWarmupVarianceNameLengthRule(80),
      new PrimaryWarmupVarianceRequiredNameRule("primary warmup variance needs an entry"),
      new PrimaryWarmupVarianceRequiredLocaleRule("primary warmup variance needs an entry"),
    ],
  );
}
