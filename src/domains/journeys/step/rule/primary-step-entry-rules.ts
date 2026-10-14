import { PrimaryStepEntry } from "./primary-step-entry.js";

/** A rule a primary step entry must pass. Check returns its problems, or none. */
export interface PrimaryStepEntryRule {
  check(item: PrimaryStepEntry): string[];
}

export class PrimaryStepEntryMarginRangeRule implements PrimaryStepEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepEntry): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryStepEntryCodeLengthRule implements PrimaryStepEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryStepEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryStepEntryOpenRateRangeRule implements PrimaryStepEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepEntry): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryStepEntryCodePrefixRule implements PrimaryStepEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryStepEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary step entry. */
export class PrimaryStepEntryValidator {
  rules: PrimaryStepEntryRule[];

  constructor(rules: PrimaryStepEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryStepEntry): string[] {
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

  requireValid(item: PrimaryStepEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryStepEntry[]): Map<string, string[]> {
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

export function defaultPrimaryStepEntryValidator(): PrimaryStepEntryValidator {
  return new PrimaryStepEntryValidator(
    [
      new PrimaryStepEntryMarginRangeRule(9.9, 3576.3),
      new PrimaryStepEntryCodeLengthRule(80),
      new PrimaryStepEntryOpenRateRangeRule(5.3, 2340.7),
      new PrimaryStepEntryCodePrefixRule("ACM"),
    ],
  );
}
