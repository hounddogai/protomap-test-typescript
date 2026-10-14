import * as text from "../../../../kit/text.js";
import { CappedNudgeBatch } from "./capped-nudge-batch.js";

/** A rule a capped nudge batch must pass. Check returns its problems, or none. */
export interface CappedNudgeBatchRule {
  check(item: CappedNudgeBatch): string[];
}

export class CappedNudgeBatchLabelLengthRule implements CappedNudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedNudgeBatchRequiredLabelRule implements CappedNudgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedNudgeBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedNudgeBatchAllowedSegmentRule implements CappedNudgeBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedNudgeBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is out of range`];
    return [];
  }
}

export class CappedNudgeBatchSequenceRangeRule implements CappedNudgeBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedNudgeBatch): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedNudgeBatchSegmentLengthRule implements CappedNudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeBatch): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped nudge batch. */
export class CappedNudgeBatchValidator {
  rules: CappedNudgeBatchRule[];

  constructor(rules: CappedNudgeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: CappedNudgeBatch): string[] {
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

  requireValid(item: CappedNudgeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedNudgeBatch[]): Map<string, string[]> {
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

export function defaultCappedNudgeBatchValidator(): CappedNudgeBatchValidator {
  return new CappedNudgeBatchValidator(
    [
      new CappedNudgeBatchLabelLengthRule(64),
      new CappedNudgeBatchRequiredLabelRule("capped nudge batch needs an entry"),
      new CappedNudgeBatchAllowedSegmentRule(["regional"]),
      new CappedNudgeBatchSequenceRangeRule(32, 86400),
      new CappedNudgeBatchSegmentLengthRule(3600),
    ],
  );
}
