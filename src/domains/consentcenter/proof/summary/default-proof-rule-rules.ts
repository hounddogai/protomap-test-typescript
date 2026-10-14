import { DefaultProofRule } from "./default-proof-rule.js";

/** A rule a default proof rule must pass. Check returns its problems, or none. */
export interface DefaultProofRuleRule {
  check(item: DefaultProofRule): string[];
}

export class DefaultProofRuleSegmentLengthRule implements DefaultProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultProofRule): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultProofRuleCodeLengthRule implements DefaultProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultProofRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultProofRuleSummaryLengthRule implements DefaultProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultProofRule): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default proof rule. */
export class DefaultProofRuleValidator {
  rules: DefaultProofRuleRule[];

  constructor(rules: DefaultProofRuleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultProofRule): string[] {
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

  requireValid(item: DefaultProofRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultProofRule[]): Map<string, string[]> {
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

export function defaultDefaultProofRuleValidator(): DefaultProofRuleValidator {
  return new DefaultProofRuleValidator(
    [
      new DefaultProofRuleSegmentLengthRule(255),
      new DefaultProofRuleCodeLengthRule(86400),
      new DefaultProofRuleSummaryLengthRule(120),
    ],
  );
}
