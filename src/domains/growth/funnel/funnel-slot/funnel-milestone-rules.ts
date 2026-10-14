import { FunnelMilestone } from "./funnel-milestone.js";

/** A rule a funnel milestone must pass. Check returns its problems, or none. */
export interface FunnelMilestoneRule {
  check(item: FunnelMilestone): string[];
}

export class FunnelMilestoneTitleLengthRule implements FunnelMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelMilestoneAudienceIdLengthRule implements FunnelMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelMilestone): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelMilestoneRequiredCodeRule implements FunnelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel milestone. */
export class FunnelMilestoneValidator {
  rules: FunnelMilestoneRule[];

  constructor(rules: FunnelMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelMilestone[]): Map<string, string[]> {
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

export function defaultFunnelMilestoneValidator(): FunnelMilestoneValidator {
  return new FunnelMilestoneValidator(
    [
      new FunnelMilestoneTitleLengthRule(16),
      new FunnelMilestoneAudienceIdLengthRule(16),
      new FunnelMilestoneRequiredCodeRule("funnel milestone needs a value"),
    ],
  );
}
