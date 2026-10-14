import * as text from "../../../../kit/text.js";
import { DefaultInsightException } from "./default-insight-exception.js";

/** A rule a default insight exception must pass. Check returns its problems, or none. */
export interface DefaultInsightExceptionRule {
  check(item: DefaultInsightException): string[];
}

export class DefaultInsightExceptionBatchSizeRangeRule implements DefaultInsightExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultInsightException): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultInsightExceptionRequiredTitleRule implements DefaultInsightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInsightException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInsightExceptionCodeLengthRule implements DefaultInsightExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInsightException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultInsightExceptionAllowedSummaryRule implements DefaultInsightExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultInsightException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is below minimum`];
    return [];
  }
}

export class DefaultInsightExceptionRequiredCodeRule implements DefaultInsightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInsightException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInsightExceptionSequenceRangeRule implements DefaultInsightExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultInsightException): string[] {
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

/** Runs every rule of a default insight exception. */
export class DefaultInsightExceptionValidator {
  rules: DefaultInsightExceptionRule[];

  constructor(rules: DefaultInsightExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInsightException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultInsightException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInsightException[]): Map<string, string[]> {
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

export function defaultDefaultInsightExceptionValidator(): DefaultInsightExceptionValidator {
  return new DefaultInsightExceptionValidator(
    [
      new DefaultInsightExceptionBatchSizeRangeRule(16, 32),
      new DefaultInsightExceptionRequiredTitleRule("default insight exception needs a value"),
      new DefaultInsightExceptionCodeLengthRule(255),
      new DefaultInsightExceptionAllowedSummaryRule([]),
      new DefaultInsightExceptionRequiredCodeRule("default insight exception needs this field"),
      new DefaultInsightExceptionSequenceRangeRule(16, 3600),
    ],
  );
}
