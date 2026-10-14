import { BranchSummary } from "./branch-summary.js";

/** A rule a branch summary must pass. Check returns its problems, or none. */
export interface BranchSummaryRule {
  check(item: BranchSummary): string[];
}

export class BranchSummaryCodePrefixRule implements BranchSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchSummaryNameLengthRule implements BranchSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchSummaryLabelLengthRule implements BranchSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch summary. */
export class BranchSummaryValidator {
  rules: BranchSummaryRule[];

  constructor(rules: BranchSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BranchSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchSummary[]): Map<string, string[]> {
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

export function defaultBranchSummaryValidator(): BranchSummaryValidator {
  return new BranchSummaryValidator(
    [
      new BranchSummaryCodePrefixRule("OPS"),
      new BranchSummaryNameLengthRule(86400),
      new BranchSummaryLabelLengthRule(1000),
    ],
  );
}
