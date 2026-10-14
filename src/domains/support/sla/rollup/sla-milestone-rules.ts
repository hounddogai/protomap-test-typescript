import { SlaMilestone } from "./sla-milestone.js";

/** A rule a sla milestone must pass. Check returns its problems, or none. */
export interface SlaMilestoneRule {
  check(item: SlaMilestone): string[];
}

export class SlaMilestoneCodePrefixRule implements SlaMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaMilestoneClicksRangeRule implements SlaMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaMilestone): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaMilestoneCodeLengthRule implements SlaMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla milestone. */
export class SlaMilestoneValidator {
  rules: SlaMilestoneRule[];

  constructor(rules: SlaMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SlaMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaMilestone[]): Map<string, string[]> {
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

export function defaultSlaMilestoneValidator(): SlaMilestoneValidator {
  return new SlaMilestoneValidator(
    [
      new SlaMilestoneCodePrefixRule("Q"),
      new SlaMilestoneClicksRangeRule(16, 120),
      new SlaMilestoneCodeLengthRule(1000),
    ],
  );
}
