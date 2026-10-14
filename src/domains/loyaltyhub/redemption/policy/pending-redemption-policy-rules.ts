import * as text from "../../../../kit/text.js";
import { PendingRedemptionPolicy } from "./pending-redemption-policy.js";

/** A rule a pending redemption policy must pass. Check returns its problems, or none. */
export interface PendingRedemptionPolicyRule {
  check(item: PendingRedemptionPolicy): string[];
}

export class PendingRedemptionPolicyRequiredTitleRule implements PendingRedemptionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRedemptionPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRedemptionPolicyRevisionRangeRule implements PendingRedemptionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRedemptionPolicy): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRedemptionPolicyCodeLengthRule implements PendingRedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRedemptionPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRedemptionPolicyAllowedCodeRule implements PendingRedemptionPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingRedemptionPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PendingRedemptionPolicyBatchSizeRangeRule implements PendingRedemptionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRedemptionPolicy): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRedemptionPolicyCodePrefixRule implements PendingRedemptionPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingRedemptionPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending redemption policy. */
export class PendingRedemptionPolicyValidator {
  rules: PendingRedemptionPolicyRule[];

  constructor(rules: PendingRedemptionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRedemptionPolicy): string[] {
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

  requireValid(item: PendingRedemptionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRedemptionPolicy[]): Map<string, string[]> {
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

export function defaultPendingRedemptionPolicyValidator(): PendingRedemptionPolicyValidator {
  return new PendingRedemptionPolicyValidator(
    [
      new PendingRedemptionPolicyRequiredTitleRule("pending redemption policy needs this field"),
      new PendingRedemptionPolicyRevisionRangeRule(32, 86400),
      new PendingRedemptionPolicyCodeLengthRule(64),
      new PendingRedemptionPolicyAllowedCodeRule([]),
      new PendingRedemptionPolicyBatchSizeRangeRule(255, 3600),
      new PendingRedemptionPolicyCodePrefixRule("REF"),
    ],
  );
}
