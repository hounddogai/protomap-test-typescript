import * as text from "../../../../kit/text.js";
import { RetentionTemplate } from "./retention-template.js";

/** A rule a retention template must pass. Check returns its problems, or none. */
export interface RetentionTemplateRule {
  check(item: RetentionTemplate): string[];
}

export class RetentionTemplateNameLengthRule implements RetentionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionTemplateSendAtRangeRule implements RetentionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionTemplate): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionTemplateAllowedCategoryRule implements RetentionTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is out of range`];
    return [];
  }
}

export class RetentionTemplateRequiredExternalRefRule implements RetentionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionTemplate): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention template. */
export class RetentionTemplateValidator {
  rules: RetentionTemplateRule[];

  constructor(rules: RetentionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionTemplate[]): Map<string, string[]> {
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

export function defaultRetentionTemplateValidator(): RetentionTemplateValidator {
  return new RetentionTemplateValidator(
    [
      new RetentionTemplateNameLengthRule(16),
      new RetentionTemplateSendAtRangeRule(16, 80),
      new RetentionTemplateAllowedCategoryRule(["fallback"]),
      new RetentionTemplateRequiredExternalRefRule("retention template needs an entry"),
    ],
  );
}
