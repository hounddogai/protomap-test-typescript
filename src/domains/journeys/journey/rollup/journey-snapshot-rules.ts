import { JourneySnapshot } from "./journey-snapshot.js";

/** A rule a journey snapshot must pass. Check returns its problems, or none. */
export interface JourneySnapshotRule {
  check(item: JourneySnapshot): string[];
}

export class JourneySnapshotCodeLengthRule implements JourneySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneySnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneySnapshotVariantLengthRule implements JourneySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneySnapshot): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneySnapshotLimitRangeRule implements JourneySnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneySnapshot): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneySnapshotLabelLengthRule implements JourneySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneySnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneySnapshotRequiredLabelRule implements JourneySnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneySnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class JourneySnapshotAttemptsRangeRule implements JourneySnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneySnapshot): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a journey snapshot. */
export class JourneySnapshotValidator {
  rules: JourneySnapshotRule[];

  constructor(rules: JourneySnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: JourneySnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneySnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneySnapshot[]): Map<string, string[]> {
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

export function defaultJourneySnapshotValidator(): JourneySnapshotValidator {
  return new JourneySnapshotValidator(
    [
      new JourneySnapshotCodeLengthRule(1000),
      new JourneySnapshotVariantLengthRule(120),
      new JourneySnapshotLimitRangeRule(64, 86400),
      new JourneySnapshotLabelLengthRule(32),
      new JourneySnapshotRequiredLabelRule("journey snapshot needs this field"),
      new JourneySnapshotAttemptsRangeRule(16, 16),
    ],
  );
}
