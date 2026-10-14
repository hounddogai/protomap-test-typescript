import { ScheduledRewardRuleSummary } from "./scheduled-reward-rule-summary.js";

/** A rule a scheduled reward rule summary must pass. Check returns its problems, or none. */
export interface ScheduledRewardRuleSummaryRule {
  check(item: ScheduledRewardRuleSummary): string[];
}

export class ScheduledRewardRuleSummaryCeilingRangeRule implements ScheduledRewardRuleSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRewardRuleSummary): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledRewardRuleSummaryGraceDaysRangeRule implements ScheduledRewardRuleSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRewardRuleSummary): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledRewardRuleSummaryRequiredNameRule implements ScheduledRewardRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardRuleSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled reward rule summary. */
export class ScheduledRewardRuleSummaryValidator {
  rules: ScheduledRewardRuleSummaryRule[];

  constructor(rules: ScheduledRewardRuleSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRewardRuleSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledRewardRuleSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRewardRuleSummary[]): Map<string, string[]> {
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

export function defaultScheduledRewardRuleSummaryValidator(): ScheduledRewardRuleSummaryValidator {
  return new ScheduledRewardRuleSummaryValidator(
    [
      new ScheduledRewardRuleSummaryCeilingRangeRule(8.3, 1206.3),
      new ScheduledRewardRuleSummaryGraceDaysRangeRule(120, 255),
      new ScheduledRewardRuleSummaryRequiredNameRule("scheduled reward rule summary needs a value"),
    ],
  );
}
