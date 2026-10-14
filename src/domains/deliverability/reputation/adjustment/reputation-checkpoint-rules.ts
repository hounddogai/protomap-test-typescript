import { ReputationCheckpoint } from "./reputation-checkpoint.js";

/** A rule a reputation checkpoint must pass. Check returns its problems, or none. */
export interface ReputationCheckpointRule {
  check(item: ReputationCheckpoint): string[];
}

export class ReputationCheckpointWeightRangeRule implements ReputationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationCheckpoint): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationCheckpointTitleLengthRule implements ReputationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationCheckpointRequiredRegionRule implements ReputationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationCheckpoint): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationCheckpointRequiredCodeRule implements ReputationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationCheckpointRegionLengthRule implements ReputationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationCheckpoint): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation checkpoint. */
export class ReputationCheckpointValidator {
  rules: ReputationCheckpointRule[];

  constructor(rules: ReputationCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationCheckpoint): string[] {
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

  requireValid(item: ReputationCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationCheckpoint[]): Map<string, string[]> {
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

export function defaultReputationCheckpointValidator(): ReputationCheckpointValidator {
  return new ReputationCheckpointValidator(
    [
      new ReputationCheckpointWeightRangeRule(1.2, 763.2),
      new ReputationCheckpointTitleLengthRule(80),
      new ReputationCheckpointRequiredRegionRule("reputation checkpoint needs a value"),
      new ReputationCheckpointRequiredCodeRule("reputation checkpoint needs this field"),
      new ReputationCheckpointRegionLengthRule(86400),
    ],
  );
}
