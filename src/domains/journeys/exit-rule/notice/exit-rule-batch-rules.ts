import * as text from "../../../../kit/text.js";
import { ExitRuleBatch } from "./exit-rule-batch.js";

/** A rule a exit rule batch must pass. Check returns its problems, or none. */
export interface ExitRuleBatchRule {
  check(item: ExitRuleBatch): string[];
}

export class ExitRuleBatchTitleLengthRule implements ExitRuleBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleBatchClicksRangeRule implements ExitRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleBatch): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleBatchAllowedSegmentRule implements ExitRuleBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is stale`];
    return [];
  }
}

export class ExitRuleBatchMarginRangeRule implements ExitRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleBatch): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleBatchRequiredNameRule implements ExitRuleBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule batch. */
export class ExitRuleBatchValidator {
  rules: ExitRuleBatchRule[];

  constructor(rules: ExitRuleBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleBatch): string[] {
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

  requireValid(item: ExitRuleBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleBatch[]): Map<string, string[]> {
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

export function defaultExitRuleBatchValidator(): ExitRuleBatchValidator {
  return new ExitRuleBatchValidator(
    [
      new ExitRuleBatchTitleLengthRule(120),
      new ExitRuleBatchClicksRangeRule(32, 64),
      new ExitRuleBatchAllowedSegmentRule(["primary", "lenient", "default"]),
      new ExitRuleBatchMarginRangeRule(6.3, 148.3),
      new ExitRuleBatchRequiredNameRule("exit rule batch needs a value"),
    ],
  );
}
