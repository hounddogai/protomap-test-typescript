import * as text from "../../../../kit/text.js";
import { ManualTicketViewMetric } from "./manual-ticket-view-metric.js";

/** A rule a manual ticket view metric must pass. Check returns its problems, or none. */
export interface ManualTicketViewMetricRule {
  check(item: ManualTicketViewMetric): string[];
}

export class ManualTicketViewMetricRequiredChannelRule implements ManualTicketViewMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTicketViewMetric): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTicketViewMetricRequiredAudienceIdRule implements ManualTicketViewMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTicketViewMetric): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTicketViewMetricMinimumRangeRule implements ManualTicketViewMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTicketViewMetric): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualTicketViewMetricAllowedTitleRule implements ManualTicketViewMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTicketViewMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class ManualTicketViewMetricCodePrefixRule implements ManualTicketViewMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualTicketViewMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual ticket view metric. */
export class ManualTicketViewMetricValidator {
  rules: ManualTicketViewMetricRule[];

  constructor(rules: ManualTicketViewMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTicketViewMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTicketViewMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTicketViewMetric[]): Map<string, string[]> {
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

export function defaultManualTicketViewMetricValidator(): ManualTicketViewMetricValidator {
  return new ManualTicketViewMetricValidator(
    [
      new ManualTicketViewMetricRequiredChannelRule("manual ticket view metric needs this field"),
      new ManualTicketViewMetricRequiredAudienceIdRule("manual ticket view metric needs a value"),
      new ManualTicketViewMetricMinimumRangeRule(7.5, 727.9),
      new ManualTicketViewMetricAllowedTitleRule(["primary"]),
      new ManualTicketViewMetricCodePrefixRule("X"),
    ],
  );
}
