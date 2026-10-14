import { SeasonalEnrollmentPolicy } from "./seasonal-enrollment-policy.js";

/** A rule a seasonal enrollment policy must pass. Check returns its problems, or none. */
export interface SeasonalEnrollmentPolicyRule {
  check(item: SeasonalEnrollmentPolicy): string[];
}

export class SeasonalEnrollmentPolicyCeilingRangeRule implements SeasonalEnrollmentPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentPolicy): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalEnrollmentPolicyRequiredCodeRule implements SeasonalEnrollmentPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEnrollmentPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEnrollmentPolicyCodeLengthRule implements SeasonalEnrollmentPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEnrollmentPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEnrollmentPolicyDiscountRangeRule implements SeasonalEnrollmentPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentPolicy): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalEnrollmentPolicyUpdatedAtRangeRule implements SeasonalEnrollmentPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentPolicy): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalEnrollmentPolicyLabelLengthRule implements SeasonalEnrollmentPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEnrollmentPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal enrollment policy. */
export class SeasonalEnrollmentPolicyValidator {
  rules: SeasonalEnrollmentPolicyRule[];

  constructor(rules: SeasonalEnrollmentPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEnrollmentPolicy): string[] {
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

  requireValid(item: SeasonalEnrollmentPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEnrollmentPolicy[]): Map<string, string[]> {
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

export function defaultSeasonalEnrollmentPolicyValidator(): SeasonalEnrollmentPolicyValidator {
  return new SeasonalEnrollmentPolicyValidator(
    [
      new SeasonalEnrollmentPolicyCeilingRangeRule(6.6, 2210.2),
      new SeasonalEnrollmentPolicyRequiredCodeRule("seasonal enrollment policy needs an entry"),
      new SeasonalEnrollmentPolicyCodeLengthRule(120),
      new SeasonalEnrollmentPolicyDiscountRangeRule(4.8, 1080.8),
      new SeasonalEnrollmentPolicyUpdatedAtRangeRule(64, 86400),
      new SeasonalEnrollmentPolicyLabelLengthRule(86400),
    ],
  );
}
