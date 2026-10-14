import { StepMilestone } from "./step-milestone.js";

/** A rule a step milestone must pass. Check returns its problems, or none. */
export interface StepMilestoneRule {
  check(item: StepMilestone): string[];
}

export class StepMilestoneBudgetRangeRule implements StepMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepMilestone): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepMilestoneCountryLengthRule implements StepMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepMilestone): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepMilestoneCodePrefixRule implements StepMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepMilestoneRequiredCountryRule implements StepMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepMilestone): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class StepMilestoneRequiredCodeRule implements StepMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepMilestoneSequenceRangeRule implements StepMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepMilestone): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a step milestone. */
export class StepMilestoneValidator {
  rules: StepMilestoneRule[];

  constructor(rules: StepMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: StepMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepMilestone[]): Map<string, string[]> {
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

export function defaultStepMilestoneValidator(): StepMilestoneValidator {
  return new StepMilestoneValidator(
    [
      new StepMilestoneBudgetRangeRule(6.8, 1309.3),
      new StepMilestoneCountryLengthRule(3600),
      new StepMilestoneCodePrefixRule("ACM"),
      new StepMilestoneRequiredCountryRule("step milestone needs this field"),
      new StepMilestoneRequiredCodeRule("step milestone needs a value"),
      new StepMilestoneSequenceRangeRule(80, 255),
    ],
  );
}
