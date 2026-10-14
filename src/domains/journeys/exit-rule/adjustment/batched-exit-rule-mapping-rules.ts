import { BatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

/** A rule a batched exit rule mapping must pass. Check returns its problems, or none. */
export interface BatchedExitRuleMappingRule {
  check(item: BatchedExitRuleMapping): string[];
}

export class BatchedExitRuleMappingRequiredCodeRule implements BatchedExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedExitRuleMappingRequiredLocaleRule implements BatchedExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleMapping): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedExitRuleMappingLocaleLengthRule implements BatchedExitRuleMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleMapping): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched exit rule mapping. */
export class BatchedExitRuleMappingValidator {
  rules: BatchedExitRuleMappingRule[];

  constructor(rules: BatchedExitRuleMappingRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedExitRuleMapping): string[] {
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

  requireValid(item: BatchedExitRuleMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedExitRuleMapping[]): Map<string, string[]> {
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

export function defaultBatchedExitRuleMappingValidator(): BatchedExitRuleMappingValidator {
  return new BatchedExitRuleMappingValidator(
    [
      new BatchedExitRuleMappingRequiredCodeRule("batched exit rule mapping needs this field"),
      new BatchedExitRuleMappingRequiredLocaleRule("batched exit rule mapping needs a value"),
      new BatchedExitRuleMappingLocaleLengthRule(16),
    ],
  );
}
