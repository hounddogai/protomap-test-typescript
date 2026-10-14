import * as text from "../../../../kit/text.js";
import { ModelAllocation } from "./model-allocation.js";

/** A rule a model allocation must pass. Check returns its problems, or none. */
export interface ModelAllocationRule {
  check(item: ModelAllocation): string[];
}

export class ModelAllocationAllowedCategoryRule implements ModelAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is below minimum`];
    return [];
  }
}

export class ModelAllocationLabelLengthRule implements ModelAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelAllocationRequiredCodeRule implements ModelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelAllocationRequiredCategoryRule implements ModelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelAllocation): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model allocation. */
export class ModelAllocationValidator {
  rules: ModelAllocationRule[];

  constructor(rules: ModelAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ModelAllocation): string[] {
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

  requireValid(item: ModelAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelAllocation[]): Map<string, string[]> {
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

export function defaultModelAllocationValidator(): ModelAllocationValidator {
  return new ModelAllocationValidator(
    [
      new ModelAllocationAllowedCategoryRule(["default", "capped"]),
      new ModelAllocationLabelLengthRule(32),
      new ModelAllocationRequiredCodeRule("model allocation needs a value"),
      new ModelAllocationRequiredCategoryRule("model allocation needs an entry"),
    ],
  );
}
