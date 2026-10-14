import { LenientTicketViewMetric } from "./lenient-ticket-view-metric.js";

/** A rule a lenient ticket view metric must pass. Check returns its problems, or none. */
export interface LenientTicketViewMetricRule {
  check(item: LenientTicketViewMetric): string[];
}

export class LenientTicketViewMetricCodePrefixRule implements LenientTicketViewMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientTicketViewMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientTicketViewMetricAmountRangeRule implements LenientTicketViewMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTicketViewMetric): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientTicketViewMetricCostRangeRule implements LenientTicketViewMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTicketViewMetric): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientTicketViewMetricCampaignRefLengthRule implements LenientTicketViewMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientTicketViewMetric): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientTicketViewMetricRequiredTitleRule implements LenientTicketViewMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTicketViewMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient ticket view metric. */
export class LenientTicketViewMetricValidator {
  rules: LenientTicketViewMetricRule[];

  constructor(rules: LenientTicketViewMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTicketViewMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientTicketViewMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTicketViewMetric[]): Map<string, string[]> {
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

export function defaultLenientTicketViewMetricValidator(): LenientTicketViewMetricValidator {
  return new LenientTicketViewMetricValidator(
    [
      new LenientTicketViewMetricCodePrefixRule("ACM"),
      new LenientTicketViewMetricAmountRangeRule(9.1, 1984.3),
      new LenientTicketViewMetricCostRangeRule(6.6, 4469.6),
      new LenientTicketViewMetricCampaignRefLengthRule(32),
      new LenientTicketViewMetricRequiredTitleRule("lenient ticket view metric needs this field"),
    ],
  );
}
