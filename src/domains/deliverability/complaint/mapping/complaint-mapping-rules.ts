import { ComplaintMapping } from "./complaint-mapping.js";

/** A rule a complaint mapping must pass. Check returns its problems, or none. */
export interface ComplaintMappingRule {
  check(item: ComplaintMapping): string[];
}

export class ComplaintMappingRequiredCohortRule implements ComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintMapping): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintMappingThresholdRangeRule implements ComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintMapping): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintMappingRequiredCodeRule implements ComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintMappingRequiredNameRule implements ComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintMappingCodePrefixRule implements ComplaintMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintMappingRequiredSummaryRule implements ComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintMapping): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint mapping. */
export class ComplaintMappingValidator {
  rules: ComplaintMappingRule[];

  constructor(rules: ComplaintMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintMapping): string[] {
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

  requireValid(item: ComplaintMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintMapping[]): Map<string, string[]> {
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

export function defaultComplaintMappingValidator(): ComplaintMappingValidator {
  return new ComplaintMappingValidator(
    [
      new ComplaintMappingRequiredCohortRule("complaint mapping needs a value"),
      new ComplaintMappingThresholdRangeRule(0.8, 933.1),
      new ComplaintMappingRequiredCodeRule("complaint mapping needs this field"),
      new ComplaintMappingRequiredNameRule("complaint mapping needs a value"),
      new ComplaintMappingCodePrefixRule("Q"),
      new ComplaintMappingRequiredSummaryRule("complaint mapping needs this field"),
    ],
  );
}
