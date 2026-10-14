import { RollingConversionPolicy } from "./rolling-conversion-policy.js";

/** A rule a rolling conversion policy must pass. Check returns its problems, or none. */
export interface RollingConversionPolicyRule {
  check(item: RollingConversionPolicy): string[];
}

export class RollingConversionPolicyTitleLengthRule implements RollingConversionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingConversionPolicyRequiredCodeRule implements RollingConversionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingConversionPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingConversionPolicyRequiredOwnerIdRule implements RollingConversionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingConversionPolicy): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RollingConversionPolicyOwnerIdLengthRule implements RollingConversionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingConversionPolicy): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingConversionPolicyRequiredTitleRule implements RollingConversionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingConversionPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingConversionPolicyBidRangeRule implements RollingConversionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingConversionPolicy): string[] {
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

/** Runs every rule of a rolling conversion policy. */
export class RollingConversionPolicyValidator {
  rules: RollingConversionPolicyRule[];

  constructor(rules: RollingConversionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RollingConversionPolicy): string[] {
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

  requireValid(item: RollingConversionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingConversionPolicy[]): Map<string, string[]> {
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

export function defaultRollingConversionPolicyValidator(): RollingConversionPolicyValidator {
  return new RollingConversionPolicyValidator(
    [
      new RollingConversionPolicyTitleLengthRule(1000),
      new RollingConversionPolicyRequiredCodeRule("rolling conversion policy needs this field"),
      new RollingConversionPolicyRequiredOwnerIdRule("rolling conversion policy needs an entry"),
      new RollingConversionPolicyOwnerIdLengthRule(64),
      new RollingConversionPolicyRequiredTitleRule("rolling conversion policy needs an entry"),
      new RollingConversionPolicyBidRangeRule(5.7, 3913.1),
    ],
  );
}
