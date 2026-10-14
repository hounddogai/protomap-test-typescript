import { WeightedEscalationSummary } from "./weighted-escalation-summary.js";

/** A rule a weighted escalation summary must pass. Check returns its problems, or none. */
export interface WeightedEscalationSummaryRule {
  check(item: WeightedEscalationSummary): string[];
}

export class WeightedEscalationSummaryRateRangeRule implements WeightedEscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationSummary): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedEscalationSummaryGraceDaysRangeRule implements WeightedEscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationSummary): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedEscalationSummaryRequiredLabelRule implements WeightedEscalationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEscalationSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEscalationSummaryNotesLengthRule implements WeightedEscalationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationSummary): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted escalation summary. */
export class WeightedEscalationSummaryValidator {
  rules: WeightedEscalationSummaryRule[];

  constructor(rules: WeightedEscalationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEscalationSummary): string[] {
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

  requireValid(item: WeightedEscalationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEscalationSummary[]): Map<string, string[]> {
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

export function defaultWeightedEscalationSummaryValidator(): WeightedEscalationSummaryValidator {
  return new WeightedEscalationSummaryValidator(
    [
      new WeightedEscalationSummaryRateRangeRule(6.7, 1095),
      new WeightedEscalationSummaryGraceDaysRangeRule(64, 120),
      new WeightedEscalationSummaryRequiredLabelRule("weighted escalation summary needs this field"),
      new WeightedEscalationSummaryNotesLengthRule(16),
    ],
  );
}
