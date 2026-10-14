import { WeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

/** A rule a weighted opt out agreement must pass. Check returns its problems, or none. */
export interface WeightedOptOutAgreementRule {
  check(item: WeightedOptOutAgreement): string[];
}

export class WeightedOptOutAgreementTitleLengthRule implements WeightedOptOutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutAgreementLabelLengthRule implements WeightedOptOutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedOptOutAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedOptOutAgreementCodePrefixRule implements WeightedOptOutAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedOptOutAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedOptOutAgreementRequiredCodeRule implements WeightedOptOutAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedOptOutAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted opt out agreement. */
export class WeightedOptOutAgreementValidator {
  rules: WeightedOptOutAgreementRule[];

  constructor(rules: WeightedOptOutAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedOptOutAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedOptOutAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedOptOutAgreement[]): Map<string, string[]> {
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

export function defaultWeightedOptOutAgreementValidator(): WeightedOptOutAgreementValidator {
  return new WeightedOptOutAgreementValidator(
    [
      new WeightedOptOutAgreementTitleLengthRule(3600),
      new WeightedOptOutAgreementLabelLengthRule(32),
      new WeightedOptOutAgreementCodePrefixRule("X"),
      new WeightedOptOutAgreementRequiredCodeRule("weighted opt out agreement needs this field"),
    ],
  );
}
