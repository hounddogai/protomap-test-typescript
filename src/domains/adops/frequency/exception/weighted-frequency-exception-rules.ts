import * as text from "../../../../kit/text.js";
import { WeightedFrequencyException } from "./weighted-frequency-exception.js";

/** A rule a weighted frequency exception must pass. Check returns its problems, or none. */
export interface WeightedFrequencyExceptionRule {
  check(item: WeightedFrequencyException): string[];
}

export class WeightedFrequencyExceptionAllowedCohortRule implements WeightedFrequencyExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedFrequencyException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is expired`];
    return [];
  }
}

export class WeightedFrequencyExceptionRequiredLabelRule implements WeightedFrequencyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFrequencyException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFrequencyExceptionRequiredCohortRule implements WeightedFrequencyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFrequencyException): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFrequencyExceptionRequiredCodeRule implements WeightedFrequencyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFrequencyException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted frequency exception. */
export class WeightedFrequencyExceptionValidator {
  rules: WeightedFrequencyExceptionRule[];

  constructor(rules: WeightedFrequencyExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFrequencyException): string[] {
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

  requireValid(item: WeightedFrequencyException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFrequencyException[]): Map<string, string[]> {
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

export function defaultWeightedFrequencyExceptionValidator(): WeightedFrequencyExceptionValidator {
  return new WeightedFrequencyExceptionValidator(
    [
      new WeightedFrequencyExceptionAllowedCohortRule(["adaptive", "manual", "rolling"]),
      new WeightedFrequencyExceptionRequiredLabelRule("weighted frequency exception needs this field"),
      new WeightedFrequencyExceptionRequiredCohortRule("weighted frequency exception needs this field"),
      new WeightedFrequencyExceptionRequiredCodeRule("weighted frequency exception needs an entry"),
    ],
  );
}
