import { WeightedOptOutClaim } from "./weighted-opt-out-claim.js";

/** A rule a weighted opt out claim must pass. Check returns its problems, or none. */
export interface WeightedOptOutClaimRule {
  check(item: WeightedOptOutClaim): string[];
}

export class WeightedOptOutClaimSegmentLengthRule implements WeightedOptOutClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutClaim): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutClaimCodePrefixRule implements WeightedOptOutClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedOptOutClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedOptOutClaimNameLengthRule implements WeightedOptOutClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutClaimCeilingRangeRule implements WeightedOptOutClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedOptOutClaim): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedOptOutClaimRequiredTimezoneRule implements WeightedOptOutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedOptOutClaim): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted opt out claim. */
export class WeightedOptOutClaimValidator {
  rules: WeightedOptOutClaimRule[];

  constructor(rules: WeightedOptOutClaimRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedOptOutClaim): string[] {
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

  requireValid(item: WeightedOptOutClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedOptOutClaim[]): Map<string, string[]> {
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

export function defaultWeightedOptOutClaimValidator(): WeightedOptOutClaimValidator {
  return new WeightedOptOutClaimValidator(
    [
      new WeightedOptOutClaimSegmentLengthRule(80),
      new WeightedOptOutClaimCodePrefixRule("ACM"),
      new WeightedOptOutClaimNameLengthRule(80),
      new WeightedOptOutClaimCeilingRangeRule(9.7, 449.7),
      new WeightedOptOutClaimRequiredTimezoneRule("weighted opt out claim needs this field"),
    ],
  );
}
