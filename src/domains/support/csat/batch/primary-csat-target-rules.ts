import { PrimaryCsatTarget } from "./primary-csat-target.js";

/** A rule a primary csat target must pass. Check returns its problems, or none. */
export interface PrimaryCsatTargetRule {
  check(item: PrimaryCsatTarget): string[];
}

export class PrimaryCsatTargetVariantLengthRule implements PrimaryCsatTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCsatTarget): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCsatTargetCountryLengthRule implements PrimaryCsatTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCsatTarget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCsatTargetCodeLengthRule implements PrimaryCsatTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCsatTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCsatTargetVisibleGuardRule implements PrimaryCsatTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryCsatTarget): string[] {
    if (item.visible && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PrimaryCsatTargetCodePrefixRule implements PrimaryCsatTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryCsatTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryCsatTargetRequiredCountryRule implements PrimaryCsatTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCsatTarget): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary csat target. */
export class PrimaryCsatTargetValidator {
  rules: PrimaryCsatTargetRule[];

  constructor(rules: PrimaryCsatTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCsatTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryCsatTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCsatTarget[]): Map<string, string[]> {
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

export function defaultPrimaryCsatTargetValidator(): PrimaryCsatTargetValidator {
  return new PrimaryCsatTargetValidator(
    [
      new PrimaryCsatTargetVariantLengthRule(80),
      new PrimaryCsatTargetCountryLengthRule(120),
      new PrimaryCsatTargetCodeLengthRule(32),
      new PrimaryCsatTargetVisibleGuardRule(9.4),
      new PrimaryCsatTargetCodePrefixRule("Q"),
      new PrimaryCsatTargetRequiredCountryRule("primary csat target needs this field"),
    ],
  );
}
