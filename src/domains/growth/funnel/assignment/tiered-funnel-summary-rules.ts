import { TieredFunnelSummary } from "./tiered-funnel-summary.js";

/** A rule a tiered funnel summary must pass. Check returns its problems, or none. */
export interface TieredFunnelSummaryRule {
  check(item: TieredFunnelSummary): string[];
}

export class TieredFunnelSummaryVisibleGuardRule implements TieredFunnelSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredFunnelSummary): string[] {
    if (item.visible && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class TieredFunnelSummaryCodePrefixRule implements TieredFunnelSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredFunnelSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredFunnelSummaryDurationMinutesRangeRule implements TieredFunnelSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFunnelSummary): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered funnel summary. */
export class TieredFunnelSummaryValidator {
  rules: TieredFunnelSummaryRule[];

  constructor(rules: TieredFunnelSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFunnelSummary): string[] {
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

  requireValid(item: TieredFunnelSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFunnelSummary[]): Map<string, string[]> {
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

export function defaultTieredFunnelSummaryValidator(): TieredFunnelSummaryValidator {
  return new TieredFunnelSummaryValidator(
    [
      new TieredFunnelSummaryVisibleGuardRule(32),
      new TieredFunnelSummaryCodePrefixRule("OPS"),
      new TieredFunnelSummaryDurationMinutesRangeRule(32, 80),
    ],
  );
}
