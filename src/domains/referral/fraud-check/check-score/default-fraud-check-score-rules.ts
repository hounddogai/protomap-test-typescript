import * as text from "../../../../kit/text.js";
import { DefaultFraudCheckScore } from "./default-fraud-check-score.js";

/** A rule a default fraud check score must pass. Check returns its problems, or none. */
export interface DefaultFraudCheckScoreRule {
  check(item: DefaultFraudCheckScore): string[];
}

export class DefaultFraudCheckScoreLabelLengthRule implements DefaultFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFraudCheckScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFraudCheckScoreRequiredLabelRule implements DefaultFraudCheckScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFraudCheckScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFraudCheckScoreVersionRangeRule implements DefaultFraudCheckScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFraudCheckScore): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultFraudCheckScoreAllowedLabelRule implements DefaultFraudCheckScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultFraudCheckScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

/** Runs every rule of a default fraud check score. */
export class DefaultFraudCheckScoreValidator {
  rules: DefaultFraudCheckScoreRule[];

  constructor(rules: DefaultFraudCheckScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFraudCheckScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultFraudCheckScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFraudCheckScore[]): Map<string, string[]> {
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

export function defaultDefaultFraudCheckScoreValidator(): DefaultFraudCheckScoreValidator {
  return new DefaultFraudCheckScoreValidator(
    [
      new DefaultFraudCheckScoreLabelLengthRule(86400),
      new DefaultFraudCheckScoreRequiredLabelRule("default fraud check score needs a value"),
      new DefaultFraudCheckScoreVersionRangeRule(120, 86400),
      new DefaultFraudCheckScoreAllowedLabelRule(["scheduled", "global"]),
    ],
  );
}
