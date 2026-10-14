import { WarmupMilestone } from "./warmup-milestone.js";

/** A rule a warmup milestone must pass. Check returns its problems, or none. */
export interface WarmupMilestoneRule {
  check(item: WarmupMilestone): string[];
}

export class WarmupMilestoneRequiredChannelRule implements WarmupMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupMilestoneChannelLengthRule implements WarmupMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupMilestone): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupMilestoneRequiredCodeRule implements WarmupMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup milestone. */
export class WarmupMilestoneValidator {
  rules: WarmupMilestoneRule[];

  constructor(rules: WarmupMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupMilestone[]): Map<string, string[]> {
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

export function defaultWarmupMilestoneValidator(): WarmupMilestoneValidator {
  return new WarmupMilestoneValidator(
    [
      new WarmupMilestoneRequiredChannelRule("warmup milestone needs an entry"),
      new WarmupMilestoneChannelLengthRule(120),
      new WarmupMilestoneRequiredCodeRule("warmup milestone needs an entry"),
    ],
  );
}
