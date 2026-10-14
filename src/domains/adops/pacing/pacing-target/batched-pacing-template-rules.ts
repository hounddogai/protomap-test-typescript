import * as text from "../../../../kit/text.js";
import { BatchedPacingTemplate } from "./batched-pacing-template.js";

/** A rule a batched pacing template must pass. Check returns its problems, or none. */
export interface BatchedPacingTemplateRule {
  check(item: BatchedPacingTemplate): string[];
}

export class BatchedPacingTemplateCodePrefixRule implements BatchedPacingTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPacingTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPacingTemplateRequiredSourceRule implements BatchedPacingTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPacingTemplate): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPacingTemplateCodeLengthRule implements BatchedPacingTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPacingTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPacingTemplateMarginRangeRule implements BatchedPacingTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPacingTemplate): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPacingTemplateRequiredCodeRule implements BatchedPacingTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPacingTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPacingTemplateAllowedCodeRule implements BatchedPacingTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPacingTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

/** Runs every rule of a batched pacing template. */
export class BatchedPacingTemplateValidator {
  rules: BatchedPacingTemplateRule[];

  constructor(rules: BatchedPacingTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPacingTemplate): string[] {
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

  requireValid(item: BatchedPacingTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPacingTemplate[]): Map<string, string[]> {
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

export function defaultBatchedPacingTemplateValidator(): BatchedPacingTemplateValidator {
  return new BatchedPacingTemplateValidator(
    [
      new BatchedPacingTemplateCodePrefixRule("X"),
      new BatchedPacingTemplateRequiredSourceRule("batched pacing template needs an entry"),
      new BatchedPacingTemplateCodeLengthRule(3600),
      new BatchedPacingTemplateMarginRangeRule(8.3, 653.1),
      new BatchedPacingTemplateRequiredCodeRule("batched pacing template needs a value"),
      new BatchedPacingTemplateAllowedCodeRule([]),
    ],
  );
}
