import { ScheduledPayoutScore } from "./scheduled-payout-score.js";

/** A rule a scheduled payout score must pass. Check returns its problems, or none. */
export interface ScheduledPayoutScoreRule {
  check(item: ScheduledPayoutScore): string[];
}

export class ScheduledPayoutScoreRequiredCodeRule implements ScheduledPayoutScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPayoutScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPayoutScoreBudgetRangeRule implements ScheduledPayoutScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPayoutScore): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledPayoutScoreCodePrefixRule implements ScheduledPayoutScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPayoutScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledPayoutScoreOpenRateRangeRule implements ScheduledPayoutScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPayoutScore): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled payout score. */
export class ScheduledPayoutScoreValidator {
  rules: ScheduledPayoutScoreRule[];

  constructor(rules: ScheduledPayoutScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPayoutScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPayoutScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPayoutScore[]): Map<string, string[]> {
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

export function defaultScheduledPayoutScoreValidator(): ScheduledPayoutScoreValidator {
  return new ScheduledPayoutScoreValidator(
    [
      new ScheduledPayoutScoreRequiredCodeRule("scheduled payout score needs an entry"),
      new ScheduledPayoutScoreBudgetRangeRule(5.6, 947.9),
      new ScheduledPayoutScoreCodePrefixRule("REF"),
      new ScheduledPayoutScoreOpenRateRangeRule(0.3, 2454.7),
    ],
  );
}
