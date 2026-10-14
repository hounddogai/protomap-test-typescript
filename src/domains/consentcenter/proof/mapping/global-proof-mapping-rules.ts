import * as text from "../../../../kit/text.js";
import { GlobalProofMapping } from "./global-proof-mapping.js";

/** A rule a global proof mapping must pass. Check returns its problems, or none. */
export interface GlobalProofMappingRule {
  check(item: GlobalProofMapping): string[];
}

export class GlobalProofMappingRequiredCodeRule implements GlobalProofMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalProofMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalProofMappingAllowedLabelRule implements GlobalProofMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalProofMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class GlobalProofMappingRequiredSummaryRule implements GlobalProofMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalProofMapping): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalProofMappingBatchSizeRangeRule implements GlobalProofMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalProofMapping): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global proof mapping. */
export class GlobalProofMappingValidator {
  rules: GlobalProofMappingRule[];

  constructor(rules: GlobalProofMappingRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalProofMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalProofMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalProofMapping[]): Map<string, string[]> {
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

export function defaultGlobalProofMappingValidator(): GlobalProofMappingValidator {
  return new GlobalProofMappingValidator(
    [
      new GlobalProofMappingRequiredCodeRule("global proof mapping needs this field"),
      new GlobalProofMappingAllowedLabelRule(["seasonal", "adaptive"]),
      new GlobalProofMappingRequiredSummaryRule("global proof mapping needs an entry"),
      new GlobalProofMappingBatchSizeRangeRule(255, 3600),
    ],
  );
}
