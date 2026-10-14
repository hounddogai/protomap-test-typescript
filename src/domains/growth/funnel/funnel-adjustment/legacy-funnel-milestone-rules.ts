import { LegacyFunnelMilestone } from "./legacy-funnel-milestone.js";

/** A rule a legacy funnel milestone must pass. Check returns its problems, or none. */
export interface LegacyFunnelMilestoneRule {
  check(item: LegacyFunnelMilestone): string[];
}

export class LegacyFunnelMilestoneWindowDaysRangeRule implements LegacyFunnelMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFunnelMilestone): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFunnelMilestoneMarginRangeRule implements LegacyFunnelMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFunnelMilestone): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFunnelMilestoneRequiredJourneyIdRule implements LegacyFunnelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFunnelMilestone): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFunnelMilestoneRequiredCodeRule implements LegacyFunnelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFunnelMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy funnel milestone. */
export class LegacyFunnelMilestoneValidator {
  rules: LegacyFunnelMilestoneRule[];

  constructor(rules: LegacyFunnelMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFunnelMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyFunnelMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFunnelMilestone[]): Map<string, string[]> {
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

export function defaultLegacyFunnelMilestoneValidator(): LegacyFunnelMilestoneValidator {
  return new LegacyFunnelMilestoneValidator(
    [
      new LegacyFunnelMilestoneWindowDaysRangeRule(16, 80),
      new LegacyFunnelMilestoneMarginRangeRule(4.8, 478),
      new LegacyFunnelMilestoneRequiredJourneyIdRule("legacy funnel milestone needs a value"),
      new LegacyFunnelMilestoneRequiredCodeRule("legacy funnel milestone needs this field"),
    ],
  );
}
