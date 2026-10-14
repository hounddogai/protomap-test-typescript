import { PrimaryExitRuleAgreement } from "./primary-exit-rule-agreement.js";

/** A rule a primary exit rule agreement must pass. Check returns its problems, or none. */
export interface PrimaryExitRuleAgreementRule {
  check(item: PrimaryExitRuleAgreement): string[];
}

export class PrimaryExitRuleAgreementRequiredCodeRule implements PrimaryExitRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryExitRuleAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryExitRuleAgreementStartsAtRangeRule implements PrimaryExitRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryExitRuleAgreement): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryExitRuleAgreementNotesLengthRule implements PrimaryExitRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryExitRuleAgreement): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryExitRuleAgreementCodePrefixRule implements PrimaryExitRuleAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryExitRuleAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryExitRuleAgreementRateRangeRule implements PrimaryExitRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryExitRuleAgreement): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary exit rule agreement. */
export class PrimaryExitRuleAgreementValidator {
  rules: PrimaryExitRuleAgreementRule[];

  constructor(rules: PrimaryExitRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryExitRuleAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryExitRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryExitRuleAgreement[]): Map<string, string[]> {
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

export function defaultPrimaryExitRuleAgreementValidator(): PrimaryExitRuleAgreementValidator {
  return new PrimaryExitRuleAgreementValidator(
    [
      new PrimaryExitRuleAgreementRequiredCodeRule("primary exit rule agreement needs a value"),
      new PrimaryExitRuleAgreementStartsAtRangeRule(1000, 86400),
      new PrimaryExitRuleAgreementNotesLengthRule(120),
      new PrimaryExitRuleAgreementCodePrefixRule("OPS"),
      new PrimaryExitRuleAgreementRateRangeRule(4.2, 2354.8),
    ],
  );
}
