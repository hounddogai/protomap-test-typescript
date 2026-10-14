import * as text from "../../../../kit/text.js";
import { InsightWindow } from "./insight-window.js";

/** A rule a insight window must pass. Check returns its problems, or none. */
export interface InsightWindowRule {
  check(item: InsightWindow): string[];
}

export class InsightWindowRequiredCodeRule implements InsightWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightWindowCodeLengthRule implements InsightWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightWindowAllowedCodeRule implements InsightWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class InsightWindowTitleLengthRule implements InsightWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightWindowCodePrefixRule implements InsightWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightWindowFrequencyCapRangeRule implements InsightWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightWindow): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a insight window. */
export class InsightWindowValidator {
  rules: InsightWindowRule[];

  constructor(rules: InsightWindowRule[]) {
    this.rules = rules;
  }

  validate(item: InsightWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightWindow[]): Map<string, string[]> {
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

export function defaultInsightWindowValidator(): InsightWindowValidator {
  return new InsightWindowValidator(
    [
      new InsightWindowRequiredCodeRule("insight window needs a value"),
      new InsightWindowCodeLengthRule(255),
      new InsightWindowAllowedCodeRule([]),
      new InsightWindowTitleLengthRule(32),
      new InsightWindowCodePrefixRule("ACM"),
      new InsightWindowFrequencyCapRangeRule(3600, 3600),
    ],
  );
}
