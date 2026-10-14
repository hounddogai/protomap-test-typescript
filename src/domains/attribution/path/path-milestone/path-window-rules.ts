import * as text from "../../../../kit/text.js";
import { PathWindow } from "./path-window.js";

/** A rule a path window must pass. Check returns its problems, or none. */
export interface PathWindowRule {
  check(item: PathWindow): string[];
}

export class PathWindowRequiredCodeRule implements PathWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathWindowConversionRateRangeRule implements PathWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathWindow): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathWindowAllowedTitleRule implements PathWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a path window. */
export class PathWindowValidator {
  rules: PathWindowRule[];

  constructor(rules: PathWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PathWindow): string[] {
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

  requireValid(item: PathWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathWindow[]): Map<string, string[]> {
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

export function defaultPathWindowValidator(): PathWindowValidator {
  return new PathWindowValidator(
    [
      new PathWindowRequiredCodeRule("path window needs an entry"),
      new PathWindowConversionRateRangeRule(6.8, 978.1),
      new PathWindowAllowedTitleRule(["weighted", "capped", "pending"]),
    ],
  );
}
