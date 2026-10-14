import { TieredStepMilestone } from "./tiered-step-milestone.js";

/** A rule a tiered step milestone must pass. Check returns its problems, or none. */
export interface TieredStepMilestoneRule {
  check(item: TieredStepMilestone): string[];
}

export class TieredStepMilestoneRequiredCodeRule implements TieredStepMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredStepMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredStepMilestoneCodeLengthRule implements TieredStepMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStepMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredStepMilestoneCodePrefixRule implements TieredStepMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredStepMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered step milestone. */
export class TieredStepMilestoneValidator {
  rules: TieredStepMilestoneRule[];

  constructor(rules: TieredStepMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: TieredStepMilestone): string[] {
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

  requireValid(item: TieredStepMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredStepMilestone[]): Map<string, string[]> {
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

export function defaultTieredStepMilestoneValidator(): TieredStepMilestoneValidator {
  return new TieredStepMilestoneValidator(
    [
      new TieredStepMilestoneRequiredCodeRule("tiered step milestone needs a value"),
      new TieredStepMilestoneCodeLengthRule(3600),
      new TieredStepMilestoneCodePrefixRule("Q"),
    ],
  );
}
