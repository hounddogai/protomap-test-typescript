import { LenientRedemptionPolicy } from "./lenient-redemption-policy.js";

/** A rule a lenient redemption policy must pass. Check returns its problems, or none. */
export interface LenientRedemptionPolicyRule {
  check(item: LenientRedemptionPolicy): string[];
}

export class LenientRedemptionPolicyTitleLengthRule implements LenientRedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRedemptionPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRedemptionPolicyRequiredCodeRule implements LenientRedemptionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRedemptionPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRedemptionPolicyCodeLengthRule implements LenientRedemptionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRedemptionPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient redemption policy. */
export class LenientRedemptionPolicyValidator {
  rules: LenientRedemptionPolicyRule[];

  constructor(rules: LenientRedemptionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRedemptionPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRedemptionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRedemptionPolicy[]): Map<string, string[]> {
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

export function defaultLenientRedemptionPolicyValidator(): LenientRedemptionPolicyValidator {
  return new LenientRedemptionPolicyValidator(
    [
      new LenientRedemptionPolicyTitleLengthRule(16),
      new LenientRedemptionPolicyRequiredCodeRule("lenient redemption policy needs an entry"),
      new LenientRedemptionPolicyCodeLengthRule(3600),
    ],
  );
}
