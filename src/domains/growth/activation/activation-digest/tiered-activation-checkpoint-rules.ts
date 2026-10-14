import { TieredActivationCheckpoint } from "./tiered-activation-checkpoint.js";

/** A rule a tiered activation checkpoint must pass. Check returns its problems, or none. */
export interface TieredActivationCheckpointRule {
  check(item: TieredActivationCheckpoint): string[];
}

export class TieredActivationCheckpointRequiredCodeRule implements TieredActivationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationCheckpointRequiredNameRule implements TieredActivationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationCheckpointSourceLengthRule implements TieredActivationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationCheckpoint): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationCheckpointNameLengthRule implements TieredActivationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationCheckpointCountryLengthRule implements TieredActivationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationCheckpoint): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationCheckpointExpiresAtRangeRule implements TieredActivationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationCheckpoint): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered activation checkpoint. */
export class TieredActivationCheckpointValidator {
  rules: TieredActivationCheckpointRule[];

  constructor(rules: TieredActivationCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TieredActivationCheckpoint): string[] {
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

  requireValid(item: TieredActivationCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredActivationCheckpoint[]): Map<string, string[]> {
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

export function defaultTieredActivationCheckpointValidator(): TieredActivationCheckpointValidator {
  return new TieredActivationCheckpointValidator(
    [
      new TieredActivationCheckpointRequiredCodeRule("tiered activation checkpoint needs an entry"),
      new TieredActivationCheckpointRequiredNameRule("tiered activation checkpoint needs this field"),
      new TieredActivationCheckpointSourceLengthRule(86400),
      new TieredActivationCheckpointNameLengthRule(255),
      new TieredActivationCheckpointCountryLengthRule(32),
      new TieredActivationCheckpointExpiresAtRangeRule(32, 3600),
    ],
  );
}
