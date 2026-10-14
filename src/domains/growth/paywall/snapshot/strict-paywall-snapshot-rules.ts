import * as text from "../../../../kit/text.js";
import { StrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

/** A rule a strict paywall snapshot must pass. Check returns its problems, or none. */
export interface StrictPaywallSnapshotRule {
  check(item: StrictPaywallSnapshot): string[];
}

export class StrictPaywallSnapshotAudienceIdLengthRule implements StrictPaywallSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPaywallSnapshot): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPaywallSnapshotCodePrefixRule implements StrictPaywallSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPaywallSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPaywallSnapshotRequiredNotesRule implements StrictPaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPaywallSnapshot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPaywallSnapshotAllowedCodeRule implements StrictPaywallSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPaywallSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class StrictPaywallSnapshotRequiredCodeRule implements StrictPaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPaywallSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPaywallSnapshotBidRangeRule implements StrictPaywallSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPaywallSnapshot): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict paywall snapshot. */
export class StrictPaywallSnapshotValidator {
  rules: StrictPaywallSnapshotRule[];

  constructor(rules: StrictPaywallSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPaywallSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPaywallSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPaywallSnapshot[]): Map<string, string[]> {
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

export function defaultStrictPaywallSnapshotValidator(): StrictPaywallSnapshotValidator {
  return new StrictPaywallSnapshotValidator(
    [
      new StrictPaywallSnapshotAudienceIdLengthRule(120),
      new StrictPaywallSnapshotCodePrefixRule("X"),
      new StrictPaywallSnapshotRequiredNotesRule("strict paywall snapshot needs this field"),
      new StrictPaywallSnapshotAllowedCodeRule([]),
      new StrictPaywallSnapshotRequiredCodeRule("strict paywall snapshot needs a value"),
      new StrictPaywallSnapshotBidRangeRule(2.8, 4544.8),
    ],
  );
}
