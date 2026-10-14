import * as text from "../../../../kit/text.js";
import { PaywallSnapshot } from "./paywall-snapshot.js";

/** A rule a paywall snapshot must pass. Check returns its problems, or none. */
export interface PaywallSnapshotRule {
  check(item: PaywallSnapshot): string[];
}

export class PaywallSnapshotRequiredVariantRule implements PaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallSnapshot): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallSnapshotCreatedAtRangeRule implements PaywallSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallSnapshot): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallSnapshotAmountRangeRule implements PaywallSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallSnapshot): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallSnapshotRequiredLabelRule implements PaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallSnapshotCodePrefixRule implements PaywallSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallSnapshotAllowedCodeRule implements PaywallSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a paywall snapshot. */
export class PaywallSnapshotValidator {
  rules: PaywallSnapshotRule[];

  constructor(rules: PaywallSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallSnapshot[]): Map<string, string[]> {
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

export function defaultPaywallSnapshotValidator(): PaywallSnapshotValidator {
  return new PaywallSnapshotValidator(
    [
      new PaywallSnapshotRequiredVariantRule("paywall snapshot needs an entry"),
      new PaywallSnapshotCreatedAtRangeRule(32, 3600),
      new PaywallSnapshotAmountRangeRule(1.1, 4957.6),
      new PaywallSnapshotRequiredLabelRule("paywall snapshot needs this field"),
      new PaywallSnapshotCodePrefixRule("OPS"),
      new PaywallSnapshotAllowedCodeRule(["pending", "batched", "default"]),
    ],
  );
}
