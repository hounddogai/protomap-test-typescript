import { PendingPaywallEntry } from "./pending-paywall-entry.js";

/** A rule a pending paywall entry must pass. Check returns its problems, or none. */
export interface PendingPaywallEntryRule {
  check(item: PendingPaywallEntry): string[];
}

export class PendingPaywallEntryCodePrefixRule implements PendingPaywallEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingPaywallEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingPaywallEntryExpiresAtRangeRule implements PendingPaywallEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPaywallEntry): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingPaywallEntryRequiredSegmentRule implements PendingPaywallEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPaywallEntry): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPaywallEntryRequiredNameRule implements PendingPaywallEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPaywallEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPaywallEntrySegmentLengthRule implements PendingPaywallEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPaywallEntry): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPaywallEntryCostRangeRule implements PendingPaywallEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPaywallEntry): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending paywall entry. */
export class PendingPaywallEntryValidator {
  rules: PendingPaywallEntryRule[];

  constructor(rules: PendingPaywallEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPaywallEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPaywallEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPaywallEntry[]): Map<string, string[]> {
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

export function defaultPendingPaywallEntryValidator(): PendingPaywallEntryValidator {
  return new PendingPaywallEntryValidator(
    [
      new PendingPaywallEntryCodePrefixRule("REF"),
      new PendingPaywallEntryExpiresAtRangeRule(32, 86400),
      new PendingPaywallEntryRequiredSegmentRule("pending paywall entry needs a value"),
      new PendingPaywallEntryRequiredNameRule("pending paywall entry needs an entry"),
      new PendingPaywallEntrySegmentLengthRule(16),
      new PendingPaywallEntryCostRangeRule(9.3, 1608.8),
    ],
  );
}
