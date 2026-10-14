import { SeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

/** A rule a seasonal warmup checkpoint must pass. Check returns its problems, or none. */
export interface SeasonalWarmupCheckpointRule {
  check(item: SeasonalWarmupCheckpoint): string[];
}

export class SeasonalWarmupCheckpointRequiredLocaleRule implements SeasonalWarmupCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupCheckpoint): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWarmupCheckpointRequiredTitleRule implements SeasonalWarmupCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWarmupCheckpointSequenceRangeRule implements SeasonalWarmupCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWarmupCheckpoint): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal warmup checkpoint. */
export class SeasonalWarmupCheckpointValidator {
  rules: SeasonalWarmupCheckpointRule[];

  constructor(rules: SeasonalWarmupCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWarmupCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalWarmupCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWarmupCheckpoint[]): Map<string, string[]> {
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

export function defaultSeasonalWarmupCheckpointValidator(): SeasonalWarmupCheckpointValidator {
  return new SeasonalWarmupCheckpointValidator(
    [
      new SeasonalWarmupCheckpointRequiredLocaleRule("seasonal warmup checkpoint needs an entry"),
      new SeasonalWarmupCheckpointRequiredTitleRule("seasonal warmup checkpoint needs an entry"),
      new SeasonalWarmupCheckpointSequenceRangeRule(120, 1000),
    ],
  );
}
