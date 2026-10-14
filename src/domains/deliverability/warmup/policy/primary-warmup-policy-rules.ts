import * as text from "../../../../kit/text.js";
import { PrimaryWarmupPolicy } from "./primary-warmup-policy.js";

/** A rule a primary warmup policy must pass. Check returns its problems, or none. */
export interface PrimaryWarmupPolicyRule {
  check(item: PrimaryWarmupPolicy): string[];
}

export class PrimaryWarmupPolicyAllowedDescriptionRule implements PrimaryWarmupPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryWarmupPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is duplicated`];
    return [];
  }
}

export class PrimaryWarmupPolicyRequiredCodeRule implements PrimaryWarmupPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryWarmupPolicyOpenRateRangeRule implements PrimaryWarmupPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryWarmupPolicy): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryWarmupPolicyPhoneLengthRule implements PrimaryWarmupPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryWarmupPolicy): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryWarmupPolicyRequiredTimezoneRule implements PrimaryWarmupPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupPolicy): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary warmup policy. */
export class PrimaryWarmupPolicyValidator {
  rules: PrimaryWarmupPolicyRule[];

  constructor(rules: PrimaryWarmupPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryWarmupPolicy): string[] {
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

  requireValid(item: PrimaryWarmupPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryWarmupPolicy[]): Map<string, string[]> {
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

export function defaultPrimaryWarmupPolicyValidator(): PrimaryWarmupPolicyValidator {
  return new PrimaryWarmupPolicyValidator(
    [
      new PrimaryWarmupPolicyAllowedDescriptionRule(["legacy", "rolling", "strict"]),
      new PrimaryWarmupPolicyRequiredCodeRule("primary warmup policy needs this field"),
      new PrimaryWarmupPolicyOpenRateRangeRule(0.3, 4412.1),
      new PrimaryWarmupPolicyPhoneLengthRule(86400),
      new PrimaryWarmupPolicyRequiredTimezoneRule("primary warmup policy needs this field"),
    ],
  );
}
