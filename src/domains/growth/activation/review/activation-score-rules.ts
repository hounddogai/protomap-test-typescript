import { ActivationScore } from "./activation-score.js";

/** A rule a activation score must pass. Check returns its problems, or none. */
export interface ActivationScoreRule {
  check(item: ActivationScore): string[];
}

export class ActivationScoreRequiredCodeRule implements ActivationScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationScoreLabelLengthRule implements ActivationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationScoreDurationMinutesRangeRule implements ActivationScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationScore): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a activation score. */
export class ActivationScoreValidator {
  rules: ActivationScoreRule[];

  constructor(rules: ActivationScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationScore): string[] {
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

  requireValid(item: ActivationScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationScore[]): Map<string, string[]> {
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

export function defaultActivationScoreValidator(): ActivationScoreValidator {
  return new ActivationScoreValidator(
    [
      new ActivationScoreRequiredCodeRule("activation score needs a value"),
      new ActivationScoreLabelLengthRule(16),
      new ActivationScoreDurationMinutesRangeRule(120, 255),
    ],
  );
}
