import { FraudCheckEntry } from "./fraud-check-entry.js";

/** A rule a fraud check entry must pass. Check returns its problems, or none. */
export interface FraudCheckEntryRule {
  check(item: FraudCheckEntry): string[];
}

export class FraudCheckEntryLabelLengthRule implements FraudCheckEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckEntryRequiredLabelRule implements FraudCheckEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckEntryRequiredRegionRule implements FraudCheckEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckEntry): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckEntryRegionLengthRule implements FraudCheckEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckEntry): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check entry. */
export class FraudCheckEntryValidator {
  rules: FraudCheckEntryRule[];

  constructor(rules: FraudCheckEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckEntry): string[] {
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

  requireValid(item: FraudCheckEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckEntry[]): Map<string, string[]> {
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

export function defaultFraudCheckEntryValidator(): FraudCheckEntryValidator {
  return new FraudCheckEntryValidator(
    [
      new FraudCheckEntryLabelLengthRule(120),
      new FraudCheckEntryRequiredLabelRule("fraud check entry needs a value"),
      new FraudCheckEntryRequiredRegionRule("fraud check entry needs a value"),
      new FraudCheckEntryRegionLengthRule(1000),
    ],
  );
}
