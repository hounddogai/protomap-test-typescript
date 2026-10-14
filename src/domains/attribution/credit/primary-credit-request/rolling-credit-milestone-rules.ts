import * as text from "../../../../kit/text.js";
import { RollingCreditMilestone } from "./rolling-credit-milestone.js";

/** A rule a rolling credit milestone must pass. Check returns its problems, or none. */
export interface RollingCreditMilestoneRule {
  check(item: RollingCreditMilestone): string[];
}

export class RollingCreditMilestoneRegionLengthRule implements RollingCreditMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCreditMilestone): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCreditMilestoneTitleLengthRule implements RollingCreditMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCreditMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCreditMilestoneCodePrefixRule implements RollingCreditMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingCreditMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingCreditMilestoneRetriesRangeRule implements RollingCreditMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCreditMilestone): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingCreditMilestoneRequiredRegionRule implements RollingCreditMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCreditMilestone): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCreditMilestoneAllowedCodeRule implements RollingCreditMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingCreditMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a rolling credit milestone. */
export class RollingCreditMilestoneValidator {
  rules: RollingCreditMilestoneRule[];

  constructor(rules: RollingCreditMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCreditMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingCreditMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCreditMilestone[]): Map<string, string[]> {
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

export function defaultRollingCreditMilestoneValidator(): RollingCreditMilestoneValidator {
  return new RollingCreditMilestoneValidator(
    [
      new RollingCreditMilestoneRegionLengthRule(1000),
      new RollingCreditMilestoneTitleLengthRule(255),
      new RollingCreditMilestoneCodePrefixRule("Q"),
      new RollingCreditMilestoneRetriesRangeRule(120, 1000),
      new RollingCreditMilestoneRequiredRegionRule("rolling credit milestone needs an entry"),
      new RollingCreditMilestoneAllowedCodeRule(["capped"]),
    ],
  );
}
