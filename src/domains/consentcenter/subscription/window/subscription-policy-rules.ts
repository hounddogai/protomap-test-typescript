import * as text from "../../../../kit/text.js";
import { SubscriptionPolicy } from "./subscription-policy.js";

/** A rule a subscription policy must pass. Check returns its problems, or none. */
export interface SubscriptionPolicyRule {
  check(item: SubscriptionPolicy): string[];
}

export class SubscriptionPolicyCodeLengthRule implements SubscriptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionPolicyRequiredLabelRule implements SubscriptionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionPolicyAllowedCodeRule implements SubscriptionPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class SubscriptionPolicyPinnedGuardRule implements SubscriptionPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SubscriptionPolicy): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a subscription policy. */
export class SubscriptionPolicyValidator {
  rules: SubscriptionPolicyRule[];

  constructor(rules: SubscriptionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionPolicy): string[] {
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

  requireValid(item: SubscriptionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionPolicy[]): Map<string, string[]> {
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

export function defaultSubscriptionPolicyValidator(): SubscriptionPolicyValidator {
  return new SubscriptionPolicyValidator(
    [
      new SubscriptionPolicyCodeLengthRule(1000),
      new SubscriptionPolicyRequiredLabelRule("subscription policy needs this field"),
      new SubscriptionPolicyAllowedCodeRule(["seasonal", "fallback"]),
      new SubscriptionPolicyPinnedGuardRule(255),
    ],
  );
}
