import { PrimaryConversionRule } from "./primary-conversion-rule.js";

/** A rule a primary conversion rule must pass. Check returns its problems, or none. */
export interface PrimaryConversionRuleRule {
  check(item: PrimaryConversionRule): string[];
}

export class PrimaryConversionRuleVariantLengthRule implements PrimaryConversionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryConversionRule): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryConversionRuleRequiredVariantRule implements PrimaryConversionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionRule): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionRuleRequiredNotesRule implements PrimaryConversionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionRule): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary conversion rule. */
export class PrimaryConversionRuleValidator {
  rules: PrimaryConversionRuleRule[];

  constructor(rules: PrimaryConversionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryConversionRule): string[] {
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

  requireValid(item: PrimaryConversionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryConversionRule[]): Map<string, string[]> {
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

export function defaultPrimaryConversionRuleValidator(): PrimaryConversionRuleValidator {
  return new PrimaryConversionRuleValidator(
    [
      new PrimaryConversionRuleVariantLengthRule(32),
      new PrimaryConversionRuleRequiredVariantRule("primary conversion rule needs a value"),
      new PrimaryConversionRuleRequiredNotesRule("primary conversion rule needs an entry"),
    ],
  );
}
