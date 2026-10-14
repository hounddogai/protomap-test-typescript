import * as text from "../../../../kit/text.js";
import { StrictFrequencyPolicy } from "./strict-frequency-policy.js";

/** A rule a strict frequency policy must pass. Check returns its problems, or none. */
export interface StrictFrequencyPolicyRule {
  check(item: StrictFrequencyPolicy): string[];
}

export class StrictFrequencyPolicyRequiredOwnerIdRule implements StrictFrequencyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFrequencyPolicy): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictFrequencyPolicyAllowedCodeRule implements StrictFrequencyPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictFrequencyPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class StrictFrequencyPolicyBidRangeRule implements StrictFrequencyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictFrequencyPolicy): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictFrequencyPolicyLabelLengthRule implements StrictFrequencyPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFrequencyPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictFrequencyPolicyOwnerIdLengthRule implements StrictFrequencyPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFrequencyPolicy): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict frequency policy. */
export class StrictFrequencyPolicyValidator {
  rules: StrictFrequencyPolicyRule[];

  constructor(rules: StrictFrequencyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: StrictFrequencyPolicy): string[] {
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

  requireValid(item: StrictFrequencyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictFrequencyPolicy[]): Map<string, string[]> {
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

export function defaultStrictFrequencyPolicyValidator(): StrictFrequencyPolicyValidator {
  return new StrictFrequencyPolicyValidator(
    [
      new StrictFrequencyPolicyRequiredOwnerIdRule("strict frequency policy needs a value"),
      new StrictFrequencyPolicyAllowedCodeRule([]),
      new StrictFrequencyPolicyBidRangeRule(4, 1335.2),
      new StrictFrequencyPolicyLabelLengthRule(32),
      new StrictFrequencyPolicyOwnerIdLengthRule(120),
    ],
  );
}
