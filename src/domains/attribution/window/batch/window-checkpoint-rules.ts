import * as text from "../../../../kit/text.js";
import { WindowCheckpoint } from "./window-checkpoint.js";

/** A rule a window checkpoint must pass. Check returns its problems, or none. */
export interface WindowCheckpointRule {
  check(item: WindowCheckpoint): string[];
}

export class WindowCheckpointMinimumRangeRule implements WindowCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowCheckpoint): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowCheckpointLocaleLengthRule implements WindowCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowCheckpoint): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowCheckpointAllowedCountryRule implements WindowCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is duplicated`];
    return [];
  }
}

export class WindowCheckpointCostRangeRule implements WindowCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowCheckpoint): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowCheckpointClicksRangeRule implements WindowCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowCheckpoint): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowCheckpointRequiredLocaleRule implements WindowCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowCheckpoint): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window checkpoint. */
export class WindowCheckpointValidator {
  rules: WindowCheckpointRule[];

  constructor(rules: WindowCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: WindowCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowCheckpoint[]): Map<string, string[]> {
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

export function defaultWindowCheckpointValidator(): WindowCheckpointValidator {
  return new WindowCheckpointValidator(
    [
      new WindowCheckpointMinimumRangeRule(4.6, 4056.8),
      new WindowCheckpointLocaleLengthRule(1000),
      new WindowCheckpointAllowedCountryRule(["global", "legacy"]),
      new WindowCheckpointCostRangeRule(9.4, 4115.9),
      new WindowCheckpointClicksRangeRule(1000, 3600),
      new WindowCheckpointRequiredLocaleRule("window checkpoint needs a value"),
    ],
  );
}
