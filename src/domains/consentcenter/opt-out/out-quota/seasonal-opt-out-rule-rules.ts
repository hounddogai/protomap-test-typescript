import { SeasonalOptOutRule } from "./seasonal-opt-out-rule.js";

/** A rule a seasonal opt out rule must pass. Check returns its problems, or none. */
export interface SeasonalOptOutRuleRule {
  check(item: SeasonalOptOutRule): string[];
}

export class SeasonalOptOutRuleApprovedGuardRule implements SeasonalOptOutRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalOptOutRule): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class SeasonalOptOutRuleRetriesRangeRule implements SeasonalOptOutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalOptOutRule): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalOptOutRuleCodePrefixRule implements SeasonalOptOutRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalOptOutRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal opt out rule. */
export class SeasonalOptOutRuleValidator {
  rules: SeasonalOptOutRuleRule[];

  constructor(rules: SeasonalOptOutRuleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalOptOutRule): string[] {
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

  requireValid(item: SeasonalOptOutRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalOptOutRule[]): Map<string, string[]> {
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

export function defaultSeasonalOptOutRuleValidator(): SeasonalOptOutRuleValidator {
  return new SeasonalOptOutRuleValidator(
    [
      new SeasonalOptOutRuleApprovedGuardRule(5.5),
      new SeasonalOptOutRuleRetriesRangeRule(16, 120),
      new SeasonalOptOutRuleCodePrefixRule("OPS"),
    ],
  );
}
