import { PrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

/** A rule a primary placement checkpoint must pass. Check returns its problems, or none. */
export interface PrimaryPlacementCheckpointRule {
  check(item: PrimaryPlacementCheckpoint): string[];
}

export class PrimaryPlacementCheckpointCurrencyLengthRule implements PrimaryPlacementCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPlacementCheckpoint): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPlacementCheckpointRequiredVariantRule implements PrimaryPlacementCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPlacementCheckpoint): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPlacementCheckpointTitleLengthRule implements PrimaryPlacementCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPlacementCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPlacementCheckpointPinnedGuardRule implements PrimaryPlacementCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryPlacementCheckpoint): string[] {
    if (item.pinned && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PrimaryPlacementCheckpointAttemptsRangeRule implements PrimaryPlacementCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPlacementCheckpoint): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary placement checkpoint. */
export class PrimaryPlacementCheckpointValidator {
  rules: PrimaryPlacementCheckpointRule[];

  constructor(rules: PrimaryPlacementCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPlacementCheckpoint): string[] {
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

  requireValid(item: PrimaryPlacementCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPlacementCheckpoint[]): Map<string, string[]> {
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

export function defaultPrimaryPlacementCheckpointValidator(): PrimaryPlacementCheckpointValidator {
  return new PrimaryPlacementCheckpointValidator(
    [
      new PrimaryPlacementCheckpointCurrencyLengthRule(120),
      new PrimaryPlacementCheckpointRequiredVariantRule("primary placement checkpoint needs an entry"),
      new PrimaryPlacementCheckpointTitleLengthRule(80),
      new PrimaryPlacementCheckpointPinnedGuardRule(255),
      new PrimaryPlacementCheckpointAttemptsRangeRule(80, 120),
    ],
  );
}
