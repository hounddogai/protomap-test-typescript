import { BatchedBranchTemplate } from "./batched-branch-template.js";

/** A rule a batched branch template must pass. Check returns its problems, or none. */
export interface BatchedBranchTemplateRule {
  check(item: BatchedBranchTemplate): string[];
}

export class BatchedBranchTemplateScoreRangeRule implements BatchedBranchTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedBranchTemplate): string[] {
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

export class BatchedBranchTemplateCodePrefixRule implements BatchedBranchTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedBranchTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedBranchTemplateLabelLengthRule implements BatchedBranchTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBranchTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedBranchTemplateRequiredLabelRule implements BatchedBranchTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBranchTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched branch template. */
export class BatchedBranchTemplateValidator {
  rules: BatchedBranchTemplateRule[];

  constructor(rules: BatchedBranchTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBranchTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedBranchTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBranchTemplate[]): Map<string, string[]> {
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

export function defaultBatchedBranchTemplateValidator(): BatchedBranchTemplateValidator {
  return new BatchedBranchTemplateValidator(
    [
      new BatchedBranchTemplateScoreRangeRule(0, 1605.6),
      new BatchedBranchTemplateCodePrefixRule("Q"),
      new BatchedBranchTemplateLabelLengthRule(255),
      new BatchedBranchTemplateRequiredLabelRule("batched branch template needs an entry"),
    ],
  );
}
