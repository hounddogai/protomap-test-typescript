import { StreakAgreement } from "./streak-agreement.js";

/** A rule a streak agreement must pass. Check returns its problems, or none. */
export interface StreakAgreementRule {
  check(item: StreakAgreement): string[];
}

export class StreakAgreementCodeLengthRule implements StreakAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakAgreementCodePrefixRule implements StreakAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakAgreementRequiredCurrencyRule implements StreakAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakAgreement): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class StreakAgreementBatchSizeRangeRule implements StreakAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakAgreement): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakAgreementCurrencyLengthRule implements StreakAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakAgreement): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak agreement. */
export class StreakAgreementValidator {
  rules: StreakAgreementRule[];

  constructor(rules: StreakAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: StreakAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakAgreement[]): Map<string, string[]> {
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

export function defaultStreakAgreementValidator(): StreakAgreementValidator {
  return new StreakAgreementValidator(
    [
      new StreakAgreementCodeLengthRule(120),
      new StreakAgreementCodePrefixRule("ACM"),
      new StreakAgreementRequiredCurrencyRule("streak agreement needs a value"),
      new StreakAgreementBatchSizeRangeRule(255, 86400),
      new StreakAgreementCurrencyLengthRule(1000),
    ],
  );
}
