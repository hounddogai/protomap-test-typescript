import * as text from "../../../../kit/text.js";
import { DefaultStreakTarget } from "./default-streak-target.js";

/** A rule a default streak target must pass. Check returns its problems, or none. */
export interface DefaultStreakTargetRule {
  check(item: DefaultStreakTarget): string[];
}

export class DefaultStreakTargetRequiredCodeRule implements DefaultStreakTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultStreakTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultStreakTargetQuantityRangeRule implements DefaultStreakTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultStreakTarget): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultStreakTargetCodePrefixRule implements DefaultStreakTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultStreakTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultStreakTargetDurationMinutesRangeRule implements DefaultStreakTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultStreakTarget): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultStreakTargetUtmSourceLengthRule implements DefaultStreakTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultStreakTarget): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultStreakTargetAllowedUtmSourceRule implements DefaultStreakTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultStreakTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is blocked`];
    return [];
  }
}

/** Runs every rule of a default streak target. */
export class DefaultStreakTargetValidator {
  rules: DefaultStreakTargetRule[];

  constructor(rules: DefaultStreakTargetRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultStreakTarget): string[] {
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

  requireValid(item: DefaultStreakTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultStreakTarget[]): Map<string, string[]> {
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

export function defaultDefaultStreakTargetValidator(): DefaultStreakTargetValidator {
  return new DefaultStreakTargetValidator(
    [
      new DefaultStreakTargetRequiredCodeRule("default streak target needs this field"),
      new DefaultStreakTargetQuantityRangeRule(120, 1000),
      new DefaultStreakTargetCodePrefixRule("Q"),
      new DefaultStreakTargetDurationMinutesRangeRule(120, 120),
      new DefaultStreakTargetUtmSourceLengthRule(64),
      new DefaultStreakTargetAllowedUtmSourceRule(["primary", "global"]),
    ],
  );
}
