import * as text from "../../../../kit/text.js";
import { BatchedDomainTemplate } from "./batched-domain-template.js";

/** A rule a batched domain template must pass. Check returns its problems, or none. */
export interface BatchedDomainTemplateRule {
  check(item: BatchedDomainTemplate): string[];
}

export class BatchedDomainTemplateRequiredCodeRule implements BatchedDomainTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDomainTemplateFrequencyCapRangeRule implements BatchedDomainTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDomainTemplate): string[] {
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

export class BatchedDomainTemplateAllowedCodeRule implements BatchedDomainTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedDomainTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class BatchedDomainTemplateRequiredLabelRule implements BatchedDomainTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched domain template. */
export class BatchedDomainTemplateValidator {
  rules: BatchedDomainTemplateRule[];

  constructor(rules: BatchedDomainTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDomainTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedDomainTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDomainTemplate[]): Map<string, string[]> {
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

export function defaultBatchedDomainTemplateValidator(): BatchedDomainTemplateValidator {
  return new BatchedDomainTemplateValidator(
    [
      new BatchedDomainTemplateRequiredCodeRule("batched domain template needs an entry"),
      new BatchedDomainTemplateFrequencyCapRangeRule(32, 80),
      new BatchedDomainTemplateAllowedCodeRule(["primary"]),
      new BatchedDomainTemplateRequiredLabelRule("batched domain template needs an entry"),
    ],
  );
}
