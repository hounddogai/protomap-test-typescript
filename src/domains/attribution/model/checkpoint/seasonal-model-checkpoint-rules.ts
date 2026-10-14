import { SeasonalModelCheckpoint } from "./seasonal-model-checkpoint.js";

/** A rule a seasonal model checkpoint must pass. Check returns its problems, or none. */
export interface SeasonalModelCheckpointRule {
  check(item: SeasonalModelCheckpoint): string[];
}

export class SeasonalModelCheckpointCurrencyLengthRule implements SeasonalModelCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalModelCheckpoint): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalModelCheckpointCeilingRangeRule implements SeasonalModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalModelCheckpoint): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalModelCheckpointSequenceRangeRule implements SeasonalModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalModelCheckpoint): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalModelCheckpointCodeLengthRule implements SeasonalModelCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalModelCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal model checkpoint. */
export class SeasonalModelCheckpointValidator {
  rules: SeasonalModelCheckpointRule[];

  constructor(rules: SeasonalModelCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalModelCheckpoint): string[] {
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

  requireValid(item: SeasonalModelCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalModelCheckpoint[]): Map<string, string[]> {
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

export function defaultSeasonalModelCheckpointValidator(): SeasonalModelCheckpointValidator {
  return new SeasonalModelCheckpointValidator(
    [
      new SeasonalModelCheckpointCurrencyLengthRule(32),
      new SeasonalModelCheckpointCeilingRangeRule(8.3, 2959.9),
      new SeasonalModelCheckpointSequenceRangeRule(32, 1000),
      new SeasonalModelCheckpointCodeLengthRule(120),
    ],
  );
}
