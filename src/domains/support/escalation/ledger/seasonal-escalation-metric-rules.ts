import { SeasonalEscalationMetric } from "./seasonal-escalation-metric.js";

/** A rule a seasonal escalation metric must pass. Check returns its problems, or none. */
export interface SeasonalEscalationMetricRule {
  check(item: SeasonalEscalationMetric): string[];
}

export class SeasonalEscalationMetricRequiredCodeRule implements SeasonalEscalationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEscalationMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEscalationMetricCapacityRangeRule implements SeasonalEscalationMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEscalationMetric): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalEscalationMetricRequiredChannelRule implements SeasonalEscalationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEscalationMetric): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal escalation metric. */
export class SeasonalEscalationMetricValidator {
  rules: SeasonalEscalationMetricRule[];

  constructor(rules: SeasonalEscalationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEscalationMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalEscalationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEscalationMetric[]): Map<string, string[]> {
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

export function defaultSeasonalEscalationMetricValidator(): SeasonalEscalationMetricValidator {
  return new SeasonalEscalationMetricValidator(
    [
      new SeasonalEscalationMetricRequiredCodeRule("seasonal escalation metric needs this field"),
      new SeasonalEscalationMetricCapacityRangeRule(255, 86400),
      new SeasonalEscalationMetricRequiredChannelRule("seasonal escalation metric needs an entry"),
    ],
  );
}
