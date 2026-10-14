import * as text from "../../../../kit/text.js";
import { LenientJourneyPolicy } from "./lenient-journey-policy.js";

/** A rule a lenient journey policy must pass. Check returns its problems, or none. */
export interface LenientJourneyPolicyRule {
  check(item: LenientJourneyPolicy): string[];
}

export class LenientJourneyPolicyUtmSourceLengthRule implements LenientJourneyPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientJourneyPolicy): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientJourneyPolicyCodePrefixRule implements LenientJourneyPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientJourneyPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientJourneyPolicyLimitRangeRule implements LenientJourneyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientJourneyPolicy): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientJourneyPolicyRequiredLabelRule implements LenientJourneyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientJourneyPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientJourneyPolicyRetriesRangeRule implements LenientJourneyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientJourneyPolicy): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientJourneyPolicyAllowedLabelRule implements LenientJourneyPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientJourneyPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

/** Runs every rule of a lenient journey policy. */
export class LenientJourneyPolicyValidator {
  rules: LenientJourneyPolicyRule[];

  constructor(rules: LenientJourneyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LenientJourneyPolicy): string[] {
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

  requireValid(item: LenientJourneyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientJourneyPolicy[]): Map<string, string[]> {
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

export function defaultLenientJourneyPolicyValidator(): LenientJourneyPolicyValidator {
  return new LenientJourneyPolicyValidator(
    [
      new LenientJourneyPolicyUtmSourceLengthRule(255),
      new LenientJourneyPolicyCodePrefixRule("Q"),
      new LenientJourneyPolicyLimitRangeRule(80, 120),
      new LenientJourneyPolicyRequiredLabelRule("lenient journey policy needs this field"),
      new LenientJourneyPolicyRetriesRangeRule(255, 86400),
      new LenientJourneyPolicyAllowedLabelRule(["legacy", "pending", "primary"]),
    ],
  );
}
