import { PrimaryProofCheckpoint } from "./primary-proof-checkpoint.js";

/** A rule a primary proof checkpoint must pass. Check returns its problems, or none. */
export interface PrimaryProofCheckpointRule {
  check(item: PrimaryProofCheckpoint): string[];
}

export class PrimaryProofCheckpointConversionRateRangeRule implements PrimaryProofCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryProofCheckpoint): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryProofCheckpointBatchSizeRangeRule implements PrimaryProofCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryProofCheckpoint): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryProofCheckpointRequiredLabelRule implements PrimaryProofCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryProofCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary proof checkpoint. */
export class PrimaryProofCheckpointValidator {
  rules: PrimaryProofCheckpointRule[];

  constructor(rules: PrimaryProofCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryProofCheckpoint): string[] {
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

  requireValid(item: PrimaryProofCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryProofCheckpoint[]): Map<string, string[]> {
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

export function defaultPrimaryProofCheckpointValidator(): PrimaryProofCheckpointValidator {
  return new PrimaryProofCheckpointValidator(
    [
      new PrimaryProofCheckpointConversionRateRangeRule(0.5, 1181.5),
      new PrimaryProofCheckpointBatchSizeRangeRule(255, 86400),
      new PrimaryProofCheckpointRequiredLabelRule("primary proof checkpoint needs an entry"),
    ],
  );
}
