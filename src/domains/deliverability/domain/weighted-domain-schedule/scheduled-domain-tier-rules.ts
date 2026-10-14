import * as text from "../../../../kit/text.js";
import { ScheduledDomainTier } from "./scheduled-domain-tier.js";

/** A rule a scheduled domain tier must pass. Check returns its problems, or none. */
export interface ScheduledDomainTierRule {
  check(item: ScheduledDomainTier): string[];
}

export class ScheduledDomainTierRequiredTitleRule implements ScheduledDomainTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDomainTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDomainTierAllowedTitleRule implements ScheduledDomainTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledDomainTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class ScheduledDomainTierLabelLengthRule implements ScheduledDomainTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDomainTierCodeLengthRule implements ScheduledDomainTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled domain tier. */
export class ScheduledDomainTierValidator {
  rules: ScheduledDomainTierRule[];

  constructor(rules: ScheduledDomainTierRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDomainTier): string[] {
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

  requireValid(item: ScheduledDomainTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDomainTier[]): Map<string, string[]> {
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

export function defaultScheduledDomainTierValidator(): ScheduledDomainTierValidator {
  return new ScheduledDomainTierValidator(
    [
      new ScheduledDomainTierRequiredTitleRule("scheduled domain tier needs this field"),
      new ScheduledDomainTierAllowedTitleRule(["global", "tiered", "strict"]),
      new ScheduledDomainTierLabelLengthRule(16),
      new ScheduledDomainTierCodeLengthRule(255),
    ],
  );
}
