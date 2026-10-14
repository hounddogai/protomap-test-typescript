import { BatchedPaywallEntry } from "./batched-paywall-entry.js";

/** A rule a batched paywall entry must pass. Check returns its problems, or none. */
export interface BatchedPaywallEntryRule {
  check(item: BatchedPaywallEntry): string[];
}

export class BatchedPaywallEntryRequiredReviewerRule implements BatchedPaywallEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPaywallEntry): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPaywallEntryRequiredCodeRule implements BatchedPaywallEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPaywallEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPaywallEntryAttemptsRangeRule implements BatchedPaywallEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPaywallEntry): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPaywallEntryCodeLengthRule implements BatchedPaywallEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPaywallEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPaywallEntryCodePrefixRule implements BatchedPaywallEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPaywallEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPaywallEntryRequiredNameRule implements BatchedPaywallEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPaywallEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched paywall entry. */
export class BatchedPaywallEntryValidator {
  rules: BatchedPaywallEntryRule[];

  constructor(rules: BatchedPaywallEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPaywallEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPaywallEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPaywallEntry[]): Map<string, string[]> {
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

export function defaultBatchedPaywallEntryValidator(): BatchedPaywallEntryValidator {
  return new BatchedPaywallEntryValidator(
    [
      new BatchedPaywallEntryRequiredReviewerRule("batched paywall entry needs this field"),
      new BatchedPaywallEntryRequiredCodeRule("batched paywall entry needs this field"),
      new BatchedPaywallEntryAttemptsRangeRule(80, 3600),
      new BatchedPaywallEntryCodeLengthRule(3600),
      new BatchedPaywallEntryCodePrefixRule("X"),
      new BatchedPaywallEntryRequiredNameRule("batched paywall entry needs this field"),
    ],
  );
}
