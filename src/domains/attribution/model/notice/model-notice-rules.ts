import * as text from "../../../../kit/text.js";
import { ModelNotice } from "./model-notice.js";

/** A rule a model notice must pass. Check returns its problems, or none. */
export interface ModelNoticeRule {
  check(item: ModelNotice): string[];
}

export class ModelNoticeAllowedCodeRule implements ModelNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class ModelNoticeAttemptsRangeRule implements ModelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelNotice): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelNoticeCostRangeRule implements ModelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelNotice): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelNoticeCodeLengthRule implements ModelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelNoticeLabelLengthRule implements ModelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelNoticeRequiredUtmSourceRule implements ModelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelNotice): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model notice. */
export class ModelNoticeValidator {
  rules: ModelNoticeRule[];

  constructor(rules: ModelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ModelNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelNotice[]): Map<string, string[]> {
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

export function defaultModelNoticeValidator(): ModelNoticeValidator {
  return new ModelNoticeValidator(
    [
      new ModelNoticeAllowedCodeRule(["legacy", "default", "rolling"]),
      new ModelNoticeAttemptsRangeRule(64, 120),
      new ModelNoticeCostRangeRule(5.7, 4445.1),
      new ModelNoticeCodeLengthRule(3600),
      new ModelNoticeLabelLengthRule(255),
      new ModelNoticeRequiredUtmSourceRule("model notice needs a value"),
    ],
  );
}
