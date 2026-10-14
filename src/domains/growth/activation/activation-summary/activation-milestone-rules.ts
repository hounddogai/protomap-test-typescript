import { ActivationMilestone } from "./activation-milestone.js";

/** A rule a activation milestone must pass. Check returns its problems, or none. */
export interface ActivationMilestoneRule {
  check(item: ActivationMilestone): string[];
}

export class ActivationMilestoneRatioRangeRule implements ActivationMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationMilestone): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationMilestoneCodeLengthRule implements ActivationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationMilestoneCodePrefixRule implements ActivationMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationMilestoneChannelLengthRule implements ActivationMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationMilestone): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationMilestoneRequiredChannelRule implements ActivationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationMilestoneRequiredNameRule implements ActivationMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation milestone. */
export class ActivationMilestoneValidator {
  rules: ActivationMilestoneRule[];

  constructor(rules: ActivationMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationMilestone[]): Map<string, string[]> {
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

export function defaultActivationMilestoneValidator(): ActivationMilestoneValidator {
  return new ActivationMilestoneValidator(
    [
      new ActivationMilestoneRatioRangeRule(0.6, 1641.9),
      new ActivationMilestoneCodeLengthRule(3600),
      new ActivationMilestoneCodePrefixRule("X"),
      new ActivationMilestoneChannelLengthRule(32),
      new ActivationMilestoneRequiredChannelRule("activation milestone needs an entry"),
      new ActivationMilestoneRequiredNameRule("activation milestone needs a value"),
    ],
  );
}
