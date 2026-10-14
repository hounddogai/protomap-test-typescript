import { StrictTierPolicy } from "./strict-tier-policy.js";

/** A rule a strict tier policy must pass. Check returns its problems, or none. */
export interface StrictTierPolicyRule {
  check(item: StrictTierPolicy): string[];
}

export class StrictTierPolicyRequiredCodeRule implements StrictTierPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTierPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTierPolicyCategoryLengthRule implements StrictTierPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictTierPolicy): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictTierPolicyCodeLengthRule implements StrictTierPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictTierPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictTierPolicyFloorValueRangeRule implements StrictTierPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictTierPolicy): string[] {
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

/** Runs every rule of a strict tier policy. */
export class StrictTierPolicyValidator {
  rules: StrictTierPolicyRule[];

  constructor(rules: StrictTierPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTierPolicy): string[] {
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

  requireValid(item: StrictTierPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTierPolicy[]): Map<string, string[]> {
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

export function defaultStrictTierPolicyValidator(): StrictTierPolicyValidator {
  return new StrictTierPolicyValidator(
    [
      new StrictTierPolicyRequiredCodeRule("strict tier policy needs this field"),
      new StrictTierPolicyCategoryLengthRule(64),
      new StrictTierPolicyCodeLengthRule(32),
      new StrictTierPolicyFloorValueRangeRule(3.4, 2481.7),
    ],
  );
}
