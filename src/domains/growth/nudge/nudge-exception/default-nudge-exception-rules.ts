import { DefaultNudgeException } from "./default-nudge-exception.js";

/** A rule a default nudge exception must pass. Check returns its problems, or none. */
export interface DefaultNudgeExceptionRule {
  check(item: DefaultNudgeException): string[];
}

export class DefaultNudgeExceptionRequiredLabelRule implements DefaultNudgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultNudgeException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultNudgeExceptionExpiresAtRangeRule implements DefaultNudgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultNudgeException): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultNudgeExceptionLabelLengthRule implements DefaultNudgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultNudgeException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultNudgeExceptionCodePrefixRule implements DefaultNudgeExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultNudgeException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default nudge exception. */
export class DefaultNudgeExceptionValidator {
  rules: DefaultNudgeExceptionRule[];

  constructor(rules: DefaultNudgeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultNudgeException): string[] {
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

  requireValid(item: DefaultNudgeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultNudgeException[]): Map<string, string[]> {
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

export function defaultDefaultNudgeExceptionValidator(): DefaultNudgeExceptionValidator {
  return new DefaultNudgeExceptionValidator(
    [
      new DefaultNudgeExceptionRequiredLabelRule("default nudge exception needs this field"),
      new DefaultNudgeExceptionExpiresAtRangeRule(16, 1000),
      new DefaultNudgeExceptionLabelLengthRule(255),
      new DefaultNudgeExceptionCodePrefixRule("ACM"),
    ],
  );
}
