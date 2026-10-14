import { FallbackComplaintPolicy } from "./fallback-complaint-policy.js";

/** A rule a fallback complaint policy must pass. Check returns its problems, or none. */
export interface FallbackComplaintPolicyRule {
  check(item: FallbackComplaintPolicy): string[];
}

export class FallbackComplaintPolicyRequiredTimezoneRule implements FallbackComplaintPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackComplaintPolicy): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackComplaintPolicyTimezoneLengthRule implements FallbackComplaintPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackComplaintPolicy): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackComplaintPolicyMinimumRangeRule implements FallbackComplaintPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackComplaintPolicy): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackComplaintPolicyNameLengthRule implements FallbackComplaintPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackComplaintPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback complaint policy. */
export class FallbackComplaintPolicyValidator {
  rules: FallbackComplaintPolicyRule[];

  constructor(rules: FallbackComplaintPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackComplaintPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackComplaintPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackComplaintPolicy[]): Map<string, string[]> {
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

export function defaultFallbackComplaintPolicyValidator(): FallbackComplaintPolicyValidator {
  return new FallbackComplaintPolicyValidator(
    [
      new FallbackComplaintPolicyRequiredTimezoneRule("fallback complaint policy needs a value"),
      new FallbackComplaintPolicyTimezoneLengthRule(255),
      new FallbackComplaintPolicyMinimumRangeRule(2.2, 2379.6),
      new FallbackComplaintPolicyNameLengthRule(16),
    ],
  );
}
