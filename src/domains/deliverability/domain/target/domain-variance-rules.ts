import * as text from "../../../../kit/text.js";
import { DomainVariance } from "./domain-variance.js";

/** A rule a domain variance must pass. Check returns its problems, or none. */
export interface DomainVarianceRule {
  check(item: DomainVariance): string[];
}

export class DomainVarianceTitleLengthRule implements DomainVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainVarianceSummaryLengthRule implements DomainVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainVariance): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainVarianceAllowedCodeRule implements DomainVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a domain variance. */
export class DomainVarianceValidator {
  rules: DomainVarianceRule[];

  constructor(rules: DomainVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: DomainVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainVariance[]): Map<string, string[]> {
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

export function defaultDomainVarianceValidator(): DomainVarianceValidator {
  return new DomainVarianceValidator(
    [
      new DomainVarianceTitleLengthRule(86400),
      new DomainVarianceSummaryLengthRule(1000),
      new DomainVarianceAllowedCodeRule(["capped"]),
    ],
  );
}
