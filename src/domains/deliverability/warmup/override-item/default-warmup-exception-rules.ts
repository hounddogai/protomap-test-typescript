import * as text from "../../../../kit/text.js";
import { DefaultWarmupException } from "./default-warmup-exception.js";

/** A rule a default warmup exception must pass. Check returns its problems, or none. */
export interface DefaultWarmupExceptionRule {
  check(item: DefaultWarmupException): string[];
}

export class DefaultWarmupExceptionAllowedNameRule implements DefaultWarmupExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultWarmupException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class DefaultWarmupExceptionRequiredCodeRule implements DefaultWarmupExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultWarmupExceptionNameLengthRule implements DefaultWarmupExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupExceptionCreatedAtRangeRule implements DefaultWarmupExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultWarmupException): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultWarmupExceptionDurationMinutesRangeRule implements DefaultWarmupExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultWarmupException): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultWarmupExceptionCodePrefixRule implements DefaultWarmupExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultWarmupException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default warmup exception. */
export class DefaultWarmupExceptionValidator {
  rules: DefaultWarmupExceptionRule[];

  constructor(rules: DefaultWarmupExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWarmupException): string[] {
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

  requireValid(item: DefaultWarmupException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWarmupException[]): Map<string, string[]> {
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

export function defaultDefaultWarmupExceptionValidator(): DefaultWarmupExceptionValidator {
  return new DefaultWarmupExceptionValidator(
    [
      new DefaultWarmupExceptionAllowedNameRule([]),
      new DefaultWarmupExceptionRequiredCodeRule("default warmup exception needs a value"),
      new DefaultWarmupExceptionNameLengthRule(16),
      new DefaultWarmupExceptionCreatedAtRangeRule(32, 86400),
      new DefaultWarmupExceptionDurationMinutesRangeRule(255, 86400),
      new DefaultWarmupExceptionCodePrefixRule("Q"),
    ],
  );
}
