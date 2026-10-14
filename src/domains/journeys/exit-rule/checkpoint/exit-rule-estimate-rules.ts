import { ExitRuleEstimate } from "./exit-rule-estimate.js";

/** A rule a exit rule estimate must pass. Check returns its problems, or none. */
export interface ExitRuleEstimateRule {
  check(item: ExitRuleEstimate): string[];
}

export class ExitRuleEstimateRequiredNameRule implements ExitRuleEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleEstimateCodePrefixRule implements ExitRuleEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleEstimateRateRangeRule implements ExitRuleEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleEstimate): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a exit rule estimate. */
export class ExitRuleEstimateValidator {
  rules: ExitRuleEstimateRule[];

  constructor(rules: ExitRuleEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleEstimate): string[] {
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

  requireValid(item: ExitRuleEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleEstimate[]): Map<string, string[]> {
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

export function defaultExitRuleEstimateValidator(): ExitRuleEstimateValidator {
  return new ExitRuleEstimateValidator(
    [
      new ExitRuleEstimateRequiredNameRule("exit rule estimate needs this field"),
      new ExitRuleEstimateCodePrefixRule("OPS"),
      new ExitRuleEstimateRateRangeRule(7.5, 3523.7),
    ],
  );
}
