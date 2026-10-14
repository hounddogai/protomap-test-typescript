import * as text from "../../../../kit/text.js";
import { StrictProofCheckpoint } from "./strict-proof-checkpoint.js";

/** A rule a strict proof checkpoint must pass. Check returns its problems, or none. */
export interface StrictProofCheckpointRule {
  check(item: StrictProofCheckpoint): string[];
}

export class StrictProofCheckpointRevisionRangeRule implements StrictProofCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictProofCheckpoint): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictProofCheckpointCodeLengthRule implements StrictProofCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictProofCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictProofCheckpointAllowedNameRule implements StrictProofCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictProofCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class StrictProofCheckpointCodePrefixRule implements StrictProofCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictProofCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictProofCheckpointJourneyIdLengthRule implements StrictProofCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictProofCheckpoint): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict proof checkpoint. */
export class StrictProofCheckpointValidator {
  rules: StrictProofCheckpointRule[];

  constructor(rules: StrictProofCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: StrictProofCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictProofCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictProofCheckpoint[]): Map<string, string[]> {
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

export function defaultStrictProofCheckpointValidator(): StrictProofCheckpointValidator {
  return new StrictProofCheckpointValidator(
    [
      new StrictProofCheckpointRevisionRangeRule(80, 255),
      new StrictProofCheckpointCodeLengthRule(255),
      new StrictProofCheckpointAllowedNameRule(["default"]),
      new StrictProofCheckpointCodePrefixRule("X"),
      new StrictProofCheckpointJourneyIdLengthRule(16),
    ],
  );
}
