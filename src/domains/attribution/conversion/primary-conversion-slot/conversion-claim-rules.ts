import { ConversionClaim } from "./conversion-claim.js";

/** A rule a conversion claim must pass. Check returns its problems, or none. */
export interface ConversionClaimRule {
  check(item: ConversionClaim): string[];
}

export class ConversionClaimRequiredTitleRule implements ConversionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionClaimTitleLengthRule implements ConversionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionClaimBudgetRangeRule implements ConversionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionClaim): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionClaimRequiredLocaleRule implements ConversionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionClaim): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionClaimRequiredCodeRule implements ConversionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion claim. */
export class ConversionClaimValidator {
  rules: ConversionClaimRule[];

  constructor(rules: ConversionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionClaim): string[] {
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

  requireValid(item: ConversionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionClaim[]): Map<string, string[]> {
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

export function defaultConversionClaimValidator(): ConversionClaimValidator {
  return new ConversionClaimValidator(
    [
      new ConversionClaimRequiredTitleRule("conversion claim needs this field"),
      new ConversionClaimTitleLengthRule(32),
      new ConversionClaimBudgetRangeRule(2.6, 927.6),
      new ConversionClaimRequiredLocaleRule("conversion claim needs this field"),
      new ConversionClaimRequiredCodeRule("conversion claim needs this field"),
    ],
  );
}
