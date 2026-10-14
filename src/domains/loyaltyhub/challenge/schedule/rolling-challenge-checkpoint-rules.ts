import * as text from "../../../../kit/text.js";
import { RollingChallengeCheckpoint } from "./rolling-challenge-checkpoint.js";

/** A rule a rolling challenge checkpoint must pass. Check returns its problems, or none. */
export interface RollingChallengeCheckpointRule {
  check(item: RollingChallengeCheckpoint): string[];
}

export class RollingChallengeCheckpointCodeLengthRule implements RollingChallengeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingChallengeCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingChallengeCheckpointAllowedChecksumRule implements RollingChallengeCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingChallengeCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is unknown`];
    return [];
  }
}

export class RollingChallengeCheckpointCodePrefixRule implements RollingChallengeCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingChallengeCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingChallengeCheckpointRequiredCodeRule implements RollingChallengeCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingChallengeCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingChallengeCheckpointRevisionRangeRule implements RollingChallengeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingChallengeCheckpoint): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling challenge checkpoint. */
export class RollingChallengeCheckpointValidator {
  rules: RollingChallengeCheckpointRule[];

  constructor(rules: RollingChallengeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RollingChallengeCheckpoint): string[] {
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

  requireValid(item: RollingChallengeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingChallengeCheckpoint[]): Map<string, string[]> {
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

export function defaultRollingChallengeCheckpointValidator(): RollingChallengeCheckpointValidator {
  return new RollingChallengeCheckpointValidator(
    [
      new RollingChallengeCheckpointCodeLengthRule(80),
      new RollingChallengeCheckpointAllowedChecksumRule(["strict", "tiered"]),
      new RollingChallengeCheckpointCodePrefixRule("OPS"),
      new RollingChallengeCheckpointRequiredCodeRule("rolling challenge checkpoint needs this field"),
      new RollingChallengeCheckpointRevisionRangeRule(16, 255),
    ],
  );
}
