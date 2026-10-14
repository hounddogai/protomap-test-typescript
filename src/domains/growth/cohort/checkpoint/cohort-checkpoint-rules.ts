import { CohortCheckpoint } from "./cohort-checkpoint.js";

/** A rule a cohort checkpoint must pass. Check returns its problems, or none. */
export interface CohortCheckpointRule {
  check(item: CohortCheckpoint): string[];
}

export class CohortCheckpointPhoneLengthRule implements CohortCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortCheckpoint): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortCheckpointImpressionsRangeRule implements CohortCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortCheckpoint): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortCheckpointRequiredNameRule implements CohortCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CohortCheckpointNameLengthRule implements CohortCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortCheckpointVersionRangeRule implements CohortCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortCheckpoint): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a cohort checkpoint. */
export class CohortCheckpointValidator {
  rules: CohortCheckpointRule[];

  constructor(rules: CohortCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: CohortCheckpoint): string[] {
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

  requireValid(item: CohortCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortCheckpoint[]): Map<string, string[]> {
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

export function defaultCohortCheckpointValidator(): CohortCheckpointValidator {
  return new CohortCheckpointValidator(
    [
      new CohortCheckpointPhoneLengthRule(32),
      new CohortCheckpointImpressionsRangeRule(1000, 86400),
      new CohortCheckpointRequiredNameRule("cohort checkpoint needs a value"),
      new CohortCheckpointNameLengthRule(86400),
      new CohortCheckpointVersionRangeRule(16, 16),
    ],
  );
}
