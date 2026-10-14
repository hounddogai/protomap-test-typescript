import { ProofProfile } from "./proof-profile.js";

/** A rule a proof profile must pass. Check returns its problems, or none. */
export interface ProofProfileRule {
  check(item: ProofProfile): string[];
}

export class ProofProfileVariantLengthRule implements ProofProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofProfile): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofProfileGraceDaysRangeRule implements ProofProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofProfile): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofProfileRequiredVariantRule implements ProofProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofProfile): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ProofProfileCurrencyLengthRule implements ProofProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofProfile): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofProfileRequiredCodeRule implements ProofProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof profile. */
export class ProofProfileValidator {
  rules: ProofProfileRule[];

  constructor(rules: ProofProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ProofProfile): string[] {
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

  requireValid(item: ProofProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofProfile[]): Map<string, string[]> {
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

export function defaultProofProfileValidator(): ProofProfileValidator {
  return new ProofProfileValidator(
    [
      new ProofProfileVariantLengthRule(120),
      new ProofProfileGraceDaysRangeRule(255, 86400),
      new ProofProfileRequiredVariantRule("proof profile needs this field"),
      new ProofProfileCurrencyLengthRule(3600),
      new ProofProfileRequiredCodeRule("proof profile needs an entry"),
    ],
  );
}
