import * as text from "../../../../kit/text.js";
import { AdaptiveConversionWindow } from "./adaptive-conversion-window.js";

/** A rule a adaptive conversion window must pass. Check returns its problems, or none. */
export interface AdaptiveConversionWindowRule {
  check(item: AdaptiveConversionWindow): string[];
}

export class AdaptiveConversionWindowAllowedContactEmailRule implements AdaptiveConversionWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveConversionWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is too long`];
    return [];
  }
}

export class AdaptiveConversionWindowRequiredCodeRule implements AdaptiveConversionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveConversionWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveConversionWindowScoreRangeRule implements AdaptiveConversionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveConversionWindow): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive conversion window. */
export class AdaptiveConversionWindowValidator {
  rules: AdaptiveConversionWindowRule[];

  constructor(rules: AdaptiveConversionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveConversionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveConversionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveConversionWindow[]): Map<string, string[]> {
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

export function defaultAdaptiveConversionWindowValidator(): AdaptiveConversionWindowValidator {
  return new AdaptiveConversionWindowValidator(
    [
      new AdaptiveConversionWindowAllowedContactEmailRule(["global", "global"]),
      new AdaptiveConversionWindowRequiredCodeRule("adaptive conversion window needs a value"),
      new AdaptiveConversionWindowScoreRangeRule(7.7, 2924.4),
    ],
  );
}
