import { TieredTouchpointCheckpoint } from "./tiered-touchpoint-checkpoint.js";

/** A rule a tiered touchpoint checkpoint must pass. Check returns its problems, or none. */
export interface TieredTouchpointCheckpointRule {
  check(item: TieredTouchpointCheckpoint): string[];
}

export class TieredTouchpointCheckpointVersionRangeRule implements TieredTouchpointCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTouchpointCheckpoint): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredTouchpointCheckpointLocaleLengthRule implements TieredTouchpointCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointCheckpoint): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointCheckpointAudienceIdLengthRule implements TieredTouchpointCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointCheckpoint): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointCheckpointCeilingRangeRule implements TieredTouchpointCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTouchpointCheckpoint): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredTouchpointCheckpointRequiredNameRule implements TieredTouchpointCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered touchpoint checkpoint. */
export class TieredTouchpointCheckpointValidator {
  rules: TieredTouchpointCheckpointRule[];

  constructor(rules: TieredTouchpointCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTouchpointCheckpoint): string[] {
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

  requireValid(item: TieredTouchpointCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTouchpointCheckpoint[]): Map<string, string[]> {
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

export function defaultTieredTouchpointCheckpointValidator(): TieredTouchpointCheckpointValidator {
  return new TieredTouchpointCheckpointValidator(
    [
      new TieredTouchpointCheckpointVersionRangeRule(80, 120),
      new TieredTouchpointCheckpointLocaleLengthRule(32),
      new TieredTouchpointCheckpointAudienceIdLengthRule(64),
      new TieredTouchpointCheckpointCeilingRangeRule(9.4, 4505.2),
      new TieredTouchpointCheckpointRequiredNameRule("tiered touchpoint checkpoint needs this field"),
    ],
  );
}
