import * as text from "../../../../kit/text.js";
import { BatchedSuppressionPlan } from "./batched-suppression-plan.js";

/** A rule a batched suppression plan must pass. Check returns its problems, or none. */
export interface BatchedSuppressionPlanRule {
  check(item: BatchedSuppressionPlan): string[];
}

export class BatchedSuppressionPlanAllowedDescriptionRule implements BatchedSuppressionPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedSuppressionPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is inconsistent`];
    return [];
  }
}

export class BatchedSuppressionPlanNameLengthRule implements BatchedSuppressionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSuppressionPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSuppressionPlanRegionLengthRule implements BatchedSuppressionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSuppressionPlan): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSuppressionPlanDescriptionLengthRule implements BatchedSuppressionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSuppressionPlan): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSuppressionPlanCodePrefixRule implements BatchedSuppressionPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedSuppressionPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedSuppressionPlanRequiredCodeRule implements BatchedSuppressionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSuppressionPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched suppression plan. */
export class BatchedSuppressionPlanValidator {
  rules: BatchedSuppressionPlanRule[];

  constructor(rules: BatchedSuppressionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSuppressionPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedSuppressionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSuppressionPlan[]): Map<string, string[]> {
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

export function defaultBatchedSuppressionPlanValidator(): BatchedSuppressionPlanValidator {
  return new BatchedSuppressionPlanValidator(
    [
      new BatchedSuppressionPlanAllowedDescriptionRule(["primary", "legacy", "adaptive"]),
      new BatchedSuppressionPlanNameLengthRule(16),
      new BatchedSuppressionPlanRegionLengthRule(16),
      new BatchedSuppressionPlanDescriptionLengthRule(80),
      new BatchedSuppressionPlanCodePrefixRule("Q"),
      new BatchedSuppressionPlanRequiredCodeRule("batched suppression plan needs this field"),
    ],
  );
}
