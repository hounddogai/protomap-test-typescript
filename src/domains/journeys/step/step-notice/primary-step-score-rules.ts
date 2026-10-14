import * as text from "../../../../kit/text.js";
import { PrimaryStepScore } from "./primary-step-score.js";

/** A rule a primary step score must pass. Check returns its problems, or none. */
export interface PrimaryStepScoreRule {
  check(item: PrimaryStepScore): string[];
}

export class PrimaryStepScoreSequenceRangeRule implements PrimaryStepScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepScore): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryStepScoreMarginRangeRule implements PrimaryStepScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepScore): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryStepScoreAllowedLabelRule implements PrimaryStepScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryStepScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class PrimaryStepScoreRequiredLabelRule implements PrimaryStepScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryStepScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary step score. */
export class PrimaryStepScoreValidator {
  rules: PrimaryStepScoreRule[];

  constructor(rules: PrimaryStepScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryStepScore): string[] {
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

  requireValid(item: PrimaryStepScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryStepScore[]): Map<string, string[]> {
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

export function defaultPrimaryStepScoreValidator(): PrimaryStepScoreValidator {
  return new PrimaryStepScoreValidator(
    [
      new PrimaryStepScoreSequenceRangeRule(64, 64),
      new PrimaryStepScoreMarginRangeRule(7.7, 3964.8),
      new PrimaryStepScoreAllowedLabelRule(["fallback"]),
      new PrimaryStepScoreRequiredLabelRule("primary step score needs a value"),
    ],
  );
}
