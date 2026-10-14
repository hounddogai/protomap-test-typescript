import { CappedPathMilestone } from "./capped-path-milestone.js";

/** A rule a capped path milestone must pass. Check returns its problems, or none. */
export interface CappedPathMilestoneRule {
  check(item: CappedPathMilestone): string[];
}

export class CappedPathMilestoneRequiredLabelRule implements CappedPathMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPathMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPathMilestoneCodePrefixRule implements CappedPathMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPathMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPathMilestoneLabelLengthRule implements CappedPathMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPathMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPathMilestoneSequenceRangeRule implements CappedPathMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPathMilestone): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedPathMilestoneRequiredOwnerIdRule implements CappedPathMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPathMilestone): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPathMilestoneCodeLengthRule implements CappedPathMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPathMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped path milestone. */
export class CappedPathMilestoneValidator {
  rules: CappedPathMilestoneRule[];

  constructor(rules: CappedPathMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPathMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedPathMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPathMilestone[]): Map<string, string[]> {
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

export function defaultCappedPathMilestoneValidator(): CappedPathMilestoneValidator {
  return new CappedPathMilestoneValidator(
    [
      new CappedPathMilestoneRequiredLabelRule("capped path milestone needs a value"),
      new CappedPathMilestoneCodePrefixRule("ACM"),
      new CappedPathMilestoneLabelLengthRule(3600),
      new CappedPathMilestoneSequenceRangeRule(16, 80),
      new CappedPathMilestoneRequiredOwnerIdRule("capped path milestone needs this field"),
      new CappedPathMilestoneCodeLengthRule(64),
    ],
  );
}
