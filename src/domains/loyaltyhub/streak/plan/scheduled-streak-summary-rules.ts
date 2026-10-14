import { ScheduledStreakSummary } from "./scheduled-streak-summary.js";

/** A rule a scheduled streak summary must pass. Check returns its problems, or none. */
export interface ScheduledStreakSummaryRule {
  check(item: ScheduledStreakSummary): string[];
}

export class ScheduledStreakSummaryNameLengthRule implements ScheduledStreakSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledStreakSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledStreakSummaryCodePrefixRule implements ScheduledStreakSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledStreakSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledStreakSummaryRequiredTitleRule implements ScheduledStreakSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledStreakSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledStreakSummaryCodeLengthRule implements ScheduledStreakSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledStreakSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled streak summary. */
export class ScheduledStreakSummaryValidator {
  rules: ScheduledStreakSummaryRule[];

  constructor(rules: ScheduledStreakSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledStreakSummary): string[] {
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

  requireValid(item: ScheduledStreakSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledStreakSummary[]): Map<string, string[]> {
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

export function defaultScheduledStreakSummaryValidator(): ScheduledStreakSummaryValidator {
  return new ScheduledStreakSummaryValidator(
    [
      new ScheduledStreakSummaryNameLengthRule(120),
      new ScheduledStreakSummaryCodePrefixRule("X"),
      new ScheduledStreakSummaryRequiredTitleRule("scheduled streak summary needs an entry"),
      new ScheduledStreakSummaryCodeLengthRule(32),
    ],
  );
}
