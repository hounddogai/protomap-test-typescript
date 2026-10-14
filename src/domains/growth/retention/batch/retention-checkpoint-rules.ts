import * as text from "../../../../kit/text.js";
import { RetentionCheckpoint } from "./retention-checkpoint.js";

/** A rule a retention checkpoint must pass. Check returns its problems, or none. */
export interface RetentionCheckpointRule {
  check(item: RetentionCheckpoint): string[];
}

export class RetentionCheckpointCodePrefixRule implements RetentionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionCheckpointRequiredCodeRule implements RetentionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionCheckpointAllowedCodeRule implements RetentionCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class RetentionCheckpointLabelLengthRule implements RetentionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention checkpoint. */
export class RetentionCheckpointValidator {
  rules: RetentionCheckpointRule[];

  constructor(rules: RetentionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionCheckpoint): string[] {
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

  requireValid(item: RetentionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionCheckpoint[]): Map<string, string[]> {
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

export function defaultRetentionCheckpointValidator(): RetentionCheckpointValidator {
  return new RetentionCheckpointValidator(
    [
      new RetentionCheckpointCodePrefixRule("OPS"),
      new RetentionCheckpointRequiredCodeRule("retention checkpoint needs a value"),
      new RetentionCheckpointAllowedCodeRule(["scheduled"]),
      new RetentionCheckpointLabelLengthRule(255),
    ],
  );
}
