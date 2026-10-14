import * as text from "../../../../kit/text.js";
import { DoubleOptInCheckpoint } from "./double-opt-in-checkpoint.js";

/** A rule a double opt in checkpoint must pass. Check returns its problems, or none. */
export interface DoubleOptInCheckpointRule {
  check(item: DoubleOptInCheckpoint): string[];
}

export class DoubleOptInCheckpointRequiredSegmentRule implements DoubleOptInCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInCheckpoint): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInCheckpointAllowedLabelRule implements DoubleOptInCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class DoubleOptInCheckpointLabelLengthRule implements DoubleOptInCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInCheckpointCodePrefixRule implements DoubleOptInCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a double opt in checkpoint. */
export class DoubleOptInCheckpointValidator {
  rules: DoubleOptInCheckpointRule[];

  constructor(rules: DoubleOptInCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInCheckpoint): string[] {
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

  requireValid(item: DoubleOptInCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInCheckpoint[]): Map<string, string[]> {
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

export function defaultDoubleOptInCheckpointValidator(): DoubleOptInCheckpointValidator {
  return new DoubleOptInCheckpointValidator(
    [
      new DoubleOptInCheckpointRequiredSegmentRule("double opt in checkpoint needs an entry"),
      new DoubleOptInCheckpointAllowedLabelRule(["lenient", "tiered"]),
      new DoubleOptInCheckpointLabelLengthRule(255),
      new DoubleOptInCheckpointCodePrefixRule("X"),
    ],
  );
}
