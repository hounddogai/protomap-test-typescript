import { LenientPlacementPolicy } from "./lenient-placement-policy.js";

/** A rule a lenient placement policy must pass. Check returns its problems, or none. */
export interface LenientPlacementPolicyRule {
  check(item: LenientPlacementPolicy): string[];
}

export class LenientPlacementPolicyRateRangeRule implements LenientPlacementPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPlacementPolicy): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPlacementPolicyCodeLengthRule implements LenientPlacementPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPlacementPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPlacementPolicySourceLengthRule implements LenientPlacementPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPlacementPolicy): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPlacementPolicyRequiredExternalRefRule implements LenientPlacementPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPlacementPolicy): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPlacementPolicyBidRangeRule implements LenientPlacementPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPlacementPolicy): string[] {
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

export class LenientPlacementPolicyRequiredCodeRule implements LenientPlacementPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPlacementPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient placement policy. */
export class LenientPlacementPolicyValidator {
  rules: LenientPlacementPolicyRule[];

  constructor(rules: LenientPlacementPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPlacementPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPlacementPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPlacementPolicy[]): Map<string, string[]> {
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

export function defaultLenientPlacementPolicyValidator(): LenientPlacementPolicyValidator {
  return new LenientPlacementPolicyValidator(
    [
      new LenientPlacementPolicyRateRangeRule(2.9, 2690.2),
      new LenientPlacementPolicyCodeLengthRule(80),
      new LenientPlacementPolicySourceLengthRule(86400),
      new LenientPlacementPolicyRequiredExternalRefRule("lenient placement policy needs a value"),
      new LenientPlacementPolicyBidRangeRule(2.8, 1589),
      new LenientPlacementPolicyRequiredCodeRule("lenient placement policy needs this field"),
    ],
  );
}
