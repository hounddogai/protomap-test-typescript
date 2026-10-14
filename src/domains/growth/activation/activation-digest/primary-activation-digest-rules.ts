import { PrimaryActivationDigest } from "./primary-activation-digest.js";

/** A rule a primary activation digest must pass. Check returns its problems, or none. */
export interface PrimaryActivationDigestRule {
  check(item: PrimaryActivationDigest): string[];
}

export class PrimaryActivationDigestRequiredTitleRule implements PrimaryActivationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryActivationDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryActivationDigestRequiredCodeRule implements PrimaryActivationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryActivationDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryActivationDigestRateRangeRule implements PrimaryActivationDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryActivationDigest): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary activation digest. */
export class PrimaryActivationDigestValidator {
  rules: PrimaryActivationDigestRule[];

  constructor(rules: PrimaryActivationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryActivationDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryActivationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryActivationDigest[]): Map<string, string[]> {
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

export function defaultPrimaryActivationDigestValidator(): PrimaryActivationDigestValidator {
  return new PrimaryActivationDigestValidator(
    [
      new PrimaryActivationDigestRequiredTitleRule("primary activation digest needs this field"),
      new PrimaryActivationDigestRequiredCodeRule("primary activation digest needs this field"),
      new PrimaryActivationDigestRateRangeRule(0.7, 275.4),
    ],
  );
}
