import { ConversionSummary } from "./conversion-summary.js";

/** A rule a conversion summary must pass. Check returns its problems, or none. */
export interface ConversionSummaryRule {
  check(item: ConversionSummary): string[];
}

export class ConversionSummaryLabelLengthRule implements ConversionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionSummaryCodeLengthRule implements ConversionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionSummaryRegionLengthRule implements ConversionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionSummary): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion summary. */
export class ConversionSummaryValidator {
  rules: ConversionSummaryRule[];

  constructor(rules: ConversionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionSummary): string[] {
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

  requireValid(item: ConversionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionSummary[]): Map<string, string[]> {
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

export function defaultConversionSummaryValidator(): ConversionSummaryValidator {
  return new ConversionSummaryValidator(
    [
      new ConversionSummaryLabelLengthRule(64),
      new ConversionSummaryCodeLengthRule(1000),
      new ConversionSummaryRegionLengthRule(1000),
    ],
  );
}
