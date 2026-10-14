import { ProofSummary } from "./proof-summary.js";

/** A rule a proof summary must pass. Check returns its problems, or none. */
export interface ProofSummaryRule {
  check(item: ProofSummary): string[];
}

export class ProofSummaryOwnerIdLengthRule implements ProofSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofSummary): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofSummaryCeilingRangeRule implements ProofSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofSummary): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofSummaryCodePrefixRule implements ProofSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a proof summary. */
export class ProofSummaryValidator {
  rules: ProofSummaryRule[];

  constructor(rules: ProofSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ProofSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofSummary[]): Map<string, string[]> {
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

export function defaultProofSummaryValidator(): ProofSummaryValidator {
  return new ProofSummaryValidator(
    [
      new ProofSummaryOwnerIdLengthRule(16),
      new ProofSummaryCeilingRangeRule(6.1, 2742.6),
      new ProofSummaryCodePrefixRule("X"),
    ],
  );
}
