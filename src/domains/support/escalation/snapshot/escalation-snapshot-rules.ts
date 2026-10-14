import * as text from "../../../../kit/text.js";
import { EscalationSnapshot } from "./escalation-snapshot.js";

/** A rule a escalation snapshot must pass. Check returns its problems, or none. */
export interface EscalationSnapshotRule {
  check(item: EscalationSnapshot): string[];
}

export class EscalationSnapshotTitleLengthRule implements EscalationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationSnapshotOpenRateRangeRule implements EscalationSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationSnapshot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationSnapshotConversionRateRangeRule implements EscalationSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationSnapshot): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationSnapshotAllowedTitleRule implements EscalationSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

/** Runs every rule of a escalation snapshot. */
export class EscalationSnapshotValidator {
  rules: EscalationSnapshotRule[];

  constructor(rules: EscalationSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationSnapshot[]): Map<string, string[]> {
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

export function defaultEscalationSnapshotValidator(): EscalationSnapshotValidator {
  return new EscalationSnapshotValidator(
    [
      new EscalationSnapshotTitleLengthRule(255),
      new EscalationSnapshotOpenRateRangeRule(5.9, 4356.4),
      new EscalationSnapshotConversionRateRangeRule(10, 2796.4),
      new EscalationSnapshotAllowedTitleRule([]),
    ],
  );
}
