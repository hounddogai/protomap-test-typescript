import { GlobalPacingSummary } from "./global-pacing-summary.js";

/** A rule a global pacing summary must pass. Check returns its problems, or none. */
export interface GlobalPacingSummaryRule {
  check(item: GlobalPacingSummary): string[];
}

export class GlobalPacingSummaryCodeLengthRule implements GlobalPacingSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPacingSummarySequenceRangeRule implements GlobalPacingSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPacingSummary): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalPacingSummaryRequiredLabelRule implements GlobalPacingSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPacingSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPacingSummaryRequiredCodeRule implements GlobalPacingSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPacingSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPacingSummaryCeilingRangeRule implements GlobalPacingSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPacingSummary): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPacingSummaryUtmSourceLengthRule implements GlobalPacingSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPacingSummary): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global pacing summary. */
export class GlobalPacingSummaryValidator {
  rules: GlobalPacingSummaryRule[];

  constructor(rules: GlobalPacingSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPacingSummary): string[] {
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

  requireValid(item: GlobalPacingSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPacingSummary[]): Map<string, string[]> {
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

export function defaultGlobalPacingSummaryValidator(): GlobalPacingSummaryValidator {
  return new GlobalPacingSummaryValidator(
    [
      new GlobalPacingSummaryCodeLengthRule(80),
      new GlobalPacingSummarySequenceRangeRule(16, 120),
      new GlobalPacingSummaryRequiredLabelRule("global pacing summary needs an entry"),
      new GlobalPacingSummaryRequiredCodeRule("global pacing summary needs a value"),
      new GlobalPacingSummaryCeilingRangeRule(5.7, 4895.6),
      new GlobalPacingSummaryUtmSourceLengthRule(1000),
    ],
  );
}
