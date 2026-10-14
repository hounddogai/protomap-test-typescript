import * as text from "../../../../kit/text.js";
import { ScheduledFrequencyProfile } from "./scheduled-frequency-profile.js";

/** A rule a scheduled frequency profile must pass. Check returns its problems, or none. */
export interface ScheduledFrequencyProfileRule {
  check(item: ScheduledFrequencyProfile): string[];
}

export class ScheduledFrequencyProfileApprovedGuardRule implements ScheduledFrequencyProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledFrequencyProfile): string[] {
    if (item.approved && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ScheduledFrequencyProfileCodePrefixRule implements ScheduledFrequencyProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledFrequencyProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledFrequencyProfileOwnerIdLengthRule implements ScheduledFrequencyProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFrequencyProfile): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFrequencyProfileAllowedTitleRule implements ScheduledFrequencyProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledFrequencyProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

/** Runs every rule of a scheduled frequency profile. */
export class ScheduledFrequencyProfileValidator {
  rules: ScheduledFrequencyProfileRule[];

  constructor(rules: ScheduledFrequencyProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFrequencyProfile): string[] {
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

  requireValid(item: ScheduledFrequencyProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFrequencyProfile[]): Map<string, string[]> {
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

export function defaultScheduledFrequencyProfileValidator(): ScheduledFrequencyProfileValidator {
  return new ScheduledFrequencyProfileValidator(
    [
      new ScheduledFrequencyProfileApprovedGuardRule(9.2),
      new ScheduledFrequencyProfileCodePrefixRule("Q"),
      new ScheduledFrequencyProfileOwnerIdLengthRule(1000),
      new ScheduledFrequencyProfileAllowedTitleRule([]),
    ],
  );
}
