import * as text from "../../../../kit/text.js";
import { BatchedEnrollmentTemplate } from "./batched-enrollment-template.js";

/** A rule a batched enrollment template must pass. Check returns its problems, or none. */
export interface BatchedEnrollmentTemplateRule {
  check(item: BatchedEnrollmentTemplate): string[];
}

export class BatchedEnrollmentTemplateAllowedCodeRule implements BatchedEnrollmentTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedEnrollmentTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class BatchedEnrollmentTemplateLabelLengthRule implements BatchedEnrollmentTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedEnrollmentTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedEnrollmentTemplateRequiredCodeRule implements BatchedEnrollmentTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedEnrollmentTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedEnrollmentTemplateCodePrefixRule implements BatchedEnrollmentTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedEnrollmentTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched enrollment template. */
export class BatchedEnrollmentTemplateValidator {
  rules: BatchedEnrollmentTemplateRule[];

  constructor(rules: BatchedEnrollmentTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedEnrollmentTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedEnrollmentTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedEnrollmentTemplate[]): Map<string, string[]> {
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

export function defaultBatchedEnrollmentTemplateValidator(): BatchedEnrollmentTemplateValidator {
  return new BatchedEnrollmentTemplateValidator(
    [
      new BatchedEnrollmentTemplateAllowedCodeRule(["global"]),
      new BatchedEnrollmentTemplateLabelLengthRule(16),
      new BatchedEnrollmentTemplateRequiredCodeRule("batched enrollment template needs this field"),
      new BatchedEnrollmentTemplateCodePrefixRule("ACM"),
    ],
  );
}
