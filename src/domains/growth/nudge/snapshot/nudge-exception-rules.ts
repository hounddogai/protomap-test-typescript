import { NudgeException } from "./nudge-exception.js";

/** A rule a nudge exception must pass. Check returns its problems, or none. */
export interface NudgeExceptionRule {
  check(item: NudgeException): string[];
}

export class NudgeExceptionCodePrefixRule implements NudgeExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeExceptionRequiredTimezoneRule implements NudgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeException): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeExceptionExpiresAtRangeRule implements NudgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeException): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeExceptionRequiredLabelRule implements NudgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge exception. */
export class NudgeExceptionValidator {
  rules: NudgeExceptionRule[];

  constructor(rules: NudgeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeException): string[] {
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

  requireValid(item: NudgeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeException[]): Map<string, string[]> {
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

export function defaultNudgeExceptionValidator(): NudgeExceptionValidator {
  return new NudgeExceptionValidator(
    [
      new NudgeExceptionCodePrefixRule("ACM"),
      new NudgeExceptionRequiredTimezoneRule("nudge exception needs this field"),
      new NudgeExceptionExpiresAtRangeRule(32, 255),
      new NudgeExceptionRequiredLabelRule("nudge exception needs a value"),
    ],
  );
}
