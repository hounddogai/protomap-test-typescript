import * as text from "../../../../kit/text.js";
import { FallbackPayoutOverride } from "./fallback-payout-override.js";

/** A rule a fallback payout override must pass. Check returns its problems, or none. */
export interface FallbackPayoutOverrideRule {
  check(item: FallbackPayoutOverride): string[];
}

export class FallbackPayoutOverrideCodePrefixRule implements FallbackPayoutOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPayoutOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPayoutOverrideApprovedGuardRule implements FallbackPayoutOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackPayoutOverride): string[] {
    if (item.approved && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackPayoutOverrideAllowedPhoneRule implements FallbackPayoutOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPayoutOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is inconsistent`];
    return [];
  }
}

export class FallbackPayoutOverrideVariantLengthRule implements FallbackPayoutOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPayoutOverride): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback payout override. */
export class FallbackPayoutOverrideValidator {
  rules: FallbackPayoutOverrideRule[];

  constructor(rules: FallbackPayoutOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPayoutOverride): string[] {
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

  requireValid(item: FallbackPayoutOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPayoutOverride[]): Map<string, string[]> {
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

export function defaultFallbackPayoutOverrideValidator(): FallbackPayoutOverrideValidator {
  return new FallbackPayoutOverrideValidator(
    [
      new FallbackPayoutOverrideCodePrefixRule("Q"),
      new FallbackPayoutOverrideApprovedGuardRule(120),
      new FallbackPayoutOverrideAllowedPhoneRule(["legacy"]),
      new FallbackPayoutOverrideVariantLengthRule(86400),
    ],
  );
}
