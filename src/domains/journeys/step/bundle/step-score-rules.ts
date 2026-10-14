import * as text from "../../../../kit/text.js";
import { StepScore } from "./step-score.js";

/** A rule a step score must pass. Check returns its problems, or none. */
export interface StepScoreRule {
  check(item: StepScore): string[];
}

export class StepScoreApprovedGuardRule implements StepScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StepScore): string[] {
    if (item.approved && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StepScoreAllowedCodeRule implements StepScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class StepScoreCodePrefixRule implements StepScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepScoreSequenceRangeRule implements StepScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepScore): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepScoreLabelLengthRule implements StepScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepScoreVersionRangeRule implements StepScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepScore): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a step score. */
export class StepScoreValidator {
  rules: StepScoreRule[];

  constructor(rules: StepScoreRule[]) {
    this.rules = rules;
  }

  validate(item: StepScore): string[] {
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

  requireValid(item: StepScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepScore[]): Map<string, string[]> {
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

export function defaultStepScoreValidator(): StepScoreValidator {
  return new StepScoreValidator(
    [
      new StepScoreApprovedGuardRule(32),
      new StepScoreAllowedCodeRule(["manual"]),
      new StepScoreCodePrefixRule("OPS"),
      new StepScoreSequenceRangeRule(64, 64),
      new StepScoreLabelLengthRule(16),
      new StepScoreVersionRangeRule(32, 3600),
    ],
  );
}
