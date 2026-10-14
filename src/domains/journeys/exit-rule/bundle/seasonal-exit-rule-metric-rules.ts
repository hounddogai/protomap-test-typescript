import * as text from "../../../../kit/text.js";
import { SeasonalExitRuleMetric } from "./seasonal-exit-rule-metric.js";

/** A rule a seasonal exit rule metric must pass. Check returns its problems, or none. */
export interface SeasonalExitRuleMetricRule {
  check(item: SeasonalExitRuleMetric): string[];
}

export class SeasonalExitRuleMetricRevisionRangeRule implements SeasonalExitRuleMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalExitRuleMetric): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalExitRuleMetricCountryLengthRule implements SeasonalExitRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalExitRuleMetric): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalExitRuleMetricCohortLengthRule implements SeasonalExitRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalExitRuleMetric): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalExitRuleMetricCodePrefixRule implements SeasonalExitRuleMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalExitRuleMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalExitRuleMetricAllowedCodeRule implements SeasonalExitRuleMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalExitRuleMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class SeasonalExitRuleMetricRequiredLabelRule implements SeasonalExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalExitRuleMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal exit rule metric. */
export class SeasonalExitRuleMetricValidator {
  rules: SeasonalExitRuleMetricRule[];

  constructor(rules: SeasonalExitRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalExitRuleMetric): string[] {
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

  requireValid(item: SeasonalExitRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalExitRuleMetric[]): Map<string, string[]> {
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

export function defaultSeasonalExitRuleMetricValidator(): SeasonalExitRuleMetricValidator {
  return new SeasonalExitRuleMetricValidator(
    [
      new SeasonalExitRuleMetricRevisionRangeRule(64, 255),
      new SeasonalExitRuleMetricCountryLengthRule(86400),
      new SeasonalExitRuleMetricCohortLengthRule(32),
      new SeasonalExitRuleMetricCodePrefixRule("OPS"),
      new SeasonalExitRuleMetricAllowedCodeRule(["capped", "scheduled", "adaptive"]),
      new SeasonalExitRuleMetricRequiredLabelRule("seasonal exit rule metric needs a value"),
    ],
  );
}
