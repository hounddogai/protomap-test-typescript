import * as text from "../../../../kit/text.js";
import { ScheduledSenderClaim } from "./scheduled-sender-claim.js";

/** A rule a scheduled sender claim must pass. Check returns its problems, or none. */
export interface ScheduledSenderClaimRule {
  check(item: ScheduledSenderClaim): string[];
}

export class ScheduledSenderClaimCodePrefixRule implements ScheduledSenderClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledSenderClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledSenderClaimTimezoneLengthRule implements ScheduledSenderClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSenderClaim): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSenderClaimAllowedTimezoneRule implements ScheduledSenderClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSenderClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is inconsistent`];
    return [];
  }
}

export class ScheduledSenderClaimRequiredCodeRule implements ScheduledSenderClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSenderClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSenderClaimRetriesRangeRule implements ScheduledSenderClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSenderClaim): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSenderClaimCodeLengthRule implements ScheduledSenderClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSenderClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled sender claim. */
export class ScheduledSenderClaimValidator {
  rules: ScheduledSenderClaimRule[];

  constructor(rules: ScheduledSenderClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSenderClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledSenderClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSenderClaim[]): Map<string, string[]> {
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

export function defaultScheduledSenderClaimValidator(): ScheduledSenderClaimValidator {
  return new ScheduledSenderClaimValidator(
    [
      new ScheduledSenderClaimCodePrefixRule("X"),
      new ScheduledSenderClaimTimezoneLengthRule(120),
      new ScheduledSenderClaimAllowedTimezoneRule(["rolling", "seasonal", "lenient"]),
      new ScheduledSenderClaimRequiredCodeRule("scheduled sender claim needs this field"),
      new ScheduledSenderClaimRetriesRangeRule(80, 120),
      new ScheduledSenderClaimCodeLengthRule(16),
    ],
  );
}
