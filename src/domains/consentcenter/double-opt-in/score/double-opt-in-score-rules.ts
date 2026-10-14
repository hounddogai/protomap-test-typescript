import * as text from "../../../../kit/text.js";
import { DoubleOptInScore } from "./double-opt-in-score.js";

/** A rule a double opt in score must pass. Check returns its problems, or none. */
export interface DoubleOptInScoreRule {
  check(item: DoubleOptInScore): string[];
}

export class DoubleOptInScoreAllowedLabelRule implements DoubleOptInScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class DoubleOptInScoreRequiredCodeRule implements DoubleOptInScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInScoreCodeLengthRule implements DoubleOptInScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInScoreCodePrefixRule implements DoubleOptInScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInScoreNotesLengthRule implements DoubleOptInScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInScore): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in score. */
export class DoubleOptInScoreValidator {
  rules: DoubleOptInScoreRule[];

  constructor(rules: DoubleOptInScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInScore[]): Map<string, string[]> {
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

export function defaultDoubleOptInScoreValidator(): DoubleOptInScoreValidator {
  return new DoubleOptInScoreValidator(
    [
      new DoubleOptInScoreAllowedLabelRule(["fallback", "pending"]),
      new DoubleOptInScoreRequiredCodeRule("double opt in score needs this field"),
      new DoubleOptInScoreCodeLengthRule(64),
      new DoubleOptInScoreCodePrefixRule("OPS"),
      new DoubleOptInScoreNotesLengthRule(1000),
    ],
  );
}
