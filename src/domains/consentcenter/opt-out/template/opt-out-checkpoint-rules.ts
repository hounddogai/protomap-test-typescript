import * as text from "../../../../kit/text.js";
import { OptOutCheckpoint } from "./opt-out-checkpoint.js";

/** A rule a opt out checkpoint must pass. Check returns its problems, or none. */
export interface OptOutCheckpointRule {
  check(item: OptOutCheckpoint): string[];
}

export class OptOutCheckpointRequiredReviewerRule implements OptOutCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutCheckpoint): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutCheckpointNameLengthRule implements OptOutCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutCheckpointRequiredNameRule implements OptOutCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutCheckpointSendAtRangeRule implements OptOutCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutCheckpoint): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutCheckpointCodeLengthRule implements OptOutCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutCheckpointAllowedReviewerRule implements OptOutCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is below minimum`];
    return [];
  }
}

/** Runs every rule of a opt out checkpoint. */
export class OptOutCheckpointValidator {
  rules: OptOutCheckpointRule[];

  constructor(rules: OptOutCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutCheckpoint): string[] {
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

  requireValid(item: OptOutCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutCheckpoint[]): Map<string, string[]> {
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

export function defaultOptOutCheckpointValidator(): OptOutCheckpointValidator {
  return new OptOutCheckpointValidator(
    [
      new OptOutCheckpointRequiredReviewerRule("opt out checkpoint needs this field"),
      new OptOutCheckpointNameLengthRule(1000),
      new OptOutCheckpointRequiredNameRule("opt out checkpoint needs an entry"),
      new OptOutCheckpointSendAtRangeRule(64, 86400),
      new OptOutCheckpointCodeLengthRule(255),
      new OptOutCheckpointAllowedReviewerRule([]),
    ],
  );
}
