import { ManualConversionPolicy } from "./manual-conversion-policy.js";

/** A rule a manual conversion policy must pass. Check returns its problems, or none. */
export interface ManualConversionPolicyRule {
  check(item: ManualConversionPolicy): string[];
}

export class ManualConversionPolicyRequiredReviewerRule implements ManualConversionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualConversionPolicy): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ManualConversionPolicyFloorValueRangeRule implements ManualConversionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualConversionPolicy): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualConversionPolicyCodeLengthRule implements ManualConversionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualConversionPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual conversion policy. */
export class ManualConversionPolicyValidator {
  rules: ManualConversionPolicyRule[];

  constructor(rules: ManualConversionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ManualConversionPolicy): string[] {
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

  requireValid(item: ManualConversionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualConversionPolicy[]): Map<string, string[]> {
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

export function defaultManualConversionPolicyValidator(): ManualConversionPolicyValidator {
  return new ManualConversionPolicyValidator(
    [
      new ManualConversionPolicyRequiredReviewerRule("manual conversion policy needs a value"),
      new ManualConversionPolicyFloorValueRangeRule(6.6, 4691.7),
      new ManualConversionPolicyCodeLengthRule(120),
    ],
  );
}
