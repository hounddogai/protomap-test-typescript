import { StreakCheckpoint } from "./streak-checkpoint.js";

/** A rule a streak checkpoint must pass. Check returns its problems, or none. */
export interface StreakCheckpointRule {
  check(item: StreakCheckpoint): string[];
}

export class StreakCheckpointVariantLengthRule implements StreakCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakCheckpoint): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakCheckpointCodePrefixRule implements StreakCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakCheckpointCodeLengthRule implements StreakCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakCheckpointRequiredAudienceIdRule implements StreakCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakCheckpoint): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak checkpoint. */
export class StreakCheckpointValidator {
  rules: StreakCheckpointRule[];

  constructor(rules: StreakCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: StreakCheckpoint): string[] {
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

  requireValid(item: StreakCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakCheckpoint[]): Map<string, string[]> {
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

export function defaultStreakCheckpointValidator(): StreakCheckpointValidator {
  return new StreakCheckpointValidator(
    [
      new StreakCheckpointVariantLengthRule(16),
      new StreakCheckpointCodePrefixRule("X"),
      new StreakCheckpointCodeLengthRule(64),
      new StreakCheckpointRequiredAudienceIdRule("streak checkpoint needs this field"),
    ],
  );
}
