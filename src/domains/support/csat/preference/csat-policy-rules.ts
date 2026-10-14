import { CsatPolicy } from "./csat-policy.js";

/** A rule a csat policy must pass. Check returns its problems, or none. */
export interface CsatPolicyRule {
  check(item: CsatPolicy): string[];
}

export class CsatPolicyRequiredRegionRule implements CsatPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatPolicy): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class CsatPolicyRetriesRangeRule implements CsatPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatPolicy): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatPolicyCohortLengthRule implements CsatPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatPolicy): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatPolicyRequiredCodeRule implements CsatPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat policy. */
export class CsatPolicyValidator {
  rules: CsatPolicyRule[];

  constructor(rules: CsatPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: CsatPolicy): string[] {
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

  requireValid(item: CsatPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatPolicy[]): Map<string, string[]> {
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

export function defaultCsatPolicyValidator(): CsatPolicyValidator {
  return new CsatPolicyValidator(
    [
      new CsatPolicyRequiredRegionRule("csat policy needs this field"),
      new CsatPolicyRetriesRangeRule(32, 255),
      new CsatPolicyCohortLengthRule(86400),
      new CsatPolicyRequiredCodeRule("csat policy needs an entry"),
    ],
  );
}
