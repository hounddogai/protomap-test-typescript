import * as text from "../../../../kit/text.js";
import { ScheduledStreakQuota } from "./scheduled-streak-quota.js";

/** A rule a scheduled streak quota must pass. Check returns its problems, or none. */
export interface ScheduledStreakQuotaRule {
  check(item: ScheduledStreakQuota): string[];
}

export class ScheduledStreakQuotaTitleLengthRule implements ScheduledStreakQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledStreakQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledStreakQuotaAllowedTitleRule implements ScheduledStreakQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledStreakQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class ScheduledStreakQuotaRequiredCodeRule implements ScheduledStreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledStreakQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledStreakQuotaCodePrefixRule implements ScheduledStreakQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledStreakQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled streak quota. */
export class ScheduledStreakQuotaValidator {
  rules: ScheduledStreakQuotaRule[];

  constructor(rules: ScheduledStreakQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledStreakQuota): string[] {
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

  requireValid(item: ScheduledStreakQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledStreakQuota[]): Map<string, string[]> {
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

export function defaultScheduledStreakQuotaValidator(): ScheduledStreakQuotaValidator {
  return new ScheduledStreakQuotaValidator(
    [
      new ScheduledStreakQuotaTitleLengthRule(1000),
      new ScheduledStreakQuotaAllowedTitleRule(["scheduled", "lenient", "legacy"]),
      new ScheduledStreakQuotaRequiredCodeRule("scheduled streak quota needs an entry"),
      new ScheduledStreakQuotaCodePrefixRule("REF"),
    ],
  );
}
