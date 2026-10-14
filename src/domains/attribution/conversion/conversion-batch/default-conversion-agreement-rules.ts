import { DefaultConversionAgreement } from "./default-conversion-agreement.js";

/** A rule a default conversion agreement must pass. Check returns its problems, or none. */
export interface DefaultConversionAgreementRule {
  check(item: DefaultConversionAgreement): string[];
}

export class DefaultConversionAgreementRequiredSummaryRule implements DefaultConversionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultConversionAgreement): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultConversionAgreementCodePrefixRule implements DefaultConversionAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultConversionAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultConversionAgreementRateRangeRule implements DefaultConversionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultConversionAgreement): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default conversion agreement. */
export class DefaultConversionAgreementValidator {
  rules: DefaultConversionAgreementRule[];

  constructor(rules: DefaultConversionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultConversionAgreement): string[] {
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

  requireValid(item: DefaultConversionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultConversionAgreement[]): Map<string, string[]> {
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

export function defaultDefaultConversionAgreementValidator(): DefaultConversionAgreementValidator {
  return new DefaultConversionAgreementValidator(
    [
      new DefaultConversionAgreementRequiredSummaryRule("default conversion agreement needs a value"),
      new DefaultConversionAgreementCodePrefixRule("X"),
      new DefaultConversionAgreementRateRangeRule(8.7, 2228.8),
    ],
  );
}
