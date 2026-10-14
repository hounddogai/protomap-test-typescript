import * as text from "../../../../kit/text.js";
import { NudgeBatch } from "./nudge-batch.js";

/** A rule a nudge batch must pass. Check returns its problems, or none. */
export interface NudgeBatchRule {
  check(item: NudgeBatch): string[];
}

export class NudgeBatchRequiredReviewerRule implements NudgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeBatch): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeBatchRequiredLabelRule implements NudgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeBatchAllowedReviewerRule implements NudgeBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is blocked`];
    return [];
  }
}

export class NudgeBatchReviewerLengthRule implements NudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeBatch): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeBatchLabelLengthRule implements NudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge batch. */
export class NudgeBatchValidator {
  rules: NudgeBatchRule[];

  constructor(rules: NudgeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeBatch): string[] {
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

  requireValid(item: NudgeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeBatch[]): Map<string, string[]> {
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

export function defaultNudgeBatchValidator(): NudgeBatchValidator {
  return new NudgeBatchValidator(
    [
      new NudgeBatchRequiredReviewerRule("nudge batch needs an entry"),
      new NudgeBatchRequiredLabelRule("nudge batch needs a value"),
      new NudgeBatchAllowedReviewerRule([]),
      new NudgeBatchReviewerLengthRule(64),
      new NudgeBatchLabelLengthRule(64),
    ],
  );
}
