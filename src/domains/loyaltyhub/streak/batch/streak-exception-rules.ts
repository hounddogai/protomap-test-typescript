import { StreakException } from "./streak-exception.js";

/** A rule a streak exception must pass. Check returns its problems, or none. */
export interface StreakExceptionRule {
  check(item: StreakException): string[];
}

export class StreakExceptionRequiredCampaignRefRule implements StreakExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakException): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class StreakExceptionCodePrefixRule implements StreakExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakExceptionCodeLengthRule implements StreakExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak exception. */
export class StreakExceptionValidator {
  rules: StreakExceptionRule[];

  constructor(rules: StreakExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: StreakException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakException[]): Map<string, string[]> {
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

export function defaultStreakExceptionValidator(): StreakExceptionValidator {
  return new StreakExceptionValidator(
    [
      new StreakExceptionRequiredCampaignRefRule("streak exception needs this field"),
      new StreakExceptionCodePrefixRule("X"),
      new StreakExceptionCodeLengthRule(16),
    ],
  );
}
