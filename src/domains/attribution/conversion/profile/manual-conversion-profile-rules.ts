import { ManualConversionProfile } from "./manual-conversion-profile.js";

/** A rule a manual conversion profile must pass. Check returns its problems, or none. */
export interface ManualConversionProfileRule {
  check(item: ManualConversionProfile): string[];
}

export class ManualConversionProfileCategoryLengthRule implements ManualConversionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualConversionProfile): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualConversionProfileRequiredNameRule implements ManualConversionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualConversionProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualConversionProfileNameLengthRule implements ManualConversionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualConversionProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual conversion profile. */
export class ManualConversionProfileValidator {
  rules: ManualConversionProfileRule[];

  constructor(rules: ManualConversionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ManualConversionProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualConversionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualConversionProfile[]): Map<string, string[]> {
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

export function defaultManualConversionProfileValidator(): ManualConversionProfileValidator {
  return new ManualConversionProfileValidator(
    [
      new ManualConversionProfileCategoryLengthRule(120),
      new ManualConversionProfileRequiredNameRule("manual conversion profile needs an entry"),
      new ManualConversionProfileNameLengthRule(16),
    ],
  );
}
