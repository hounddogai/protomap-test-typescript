import * as text from "../../../../kit/text.js";
import { RollingCsatProfile } from "./rolling-csat-profile.js";

/** A rule a rolling csat profile must pass. Check returns its problems, or none. */
export interface RollingCsatProfileRule {
  check(item: RollingCsatProfile): string[];
}

export class RollingCsatProfileRequiredCodeRule implements RollingCsatProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCsatProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCsatProfileCodePrefixRule implements RollingCsatProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingCsatProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingCsatProfileStartsAtRangeRule implements RollingCsatProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCsatProfile): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingCsatProfileSourceLengthRule implements RollingCsatProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCsatProfile): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCsatProfileAllowedSourceRule implements RollingCsatProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingCsatProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is inconsistent`];
    return [];
  }
}

export class RollingCsatProfileRequiredCategoryRule implements RollingCsatProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCsatProfile): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling csat profile. */
export class RollingCsatProfileValidator {
  rules: RollingCsatProfileRule[];

  constructor(rules: RollingCsatProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCsatProfile): string[] {
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

  requireValid(item: RollingCsatProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCsatProfile[]): Map<string, string[]> {
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

export function defaultRollingCsatProfileValidator(): RollingCsatProfileValidator {
  return new RollingCsatProfileValidator(
    [
      new RollingCsatProfileRequiredCodeRule("rolling csat profile needs this field"),
      new RollingCsatProfileCodePrefixRule("Q"),
      new RollingCsatProfileStartsAtRangeRule(64, 80),
      new RollingCsatProfileSourceLengthRule(80),
      new RollingCsatProfileAllowedSourceRule(["primary"]),
      new RollingCsatProfileRequiredCategoryRule("rolling csat profile needs an entry"),
    ],
  );
}
