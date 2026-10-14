import { BatchedFunnelRule } from "./batched-funnel-rule.js";

/** A rule a batched funnel rule must pass. Check returns its problems, or none. */
export interface BatchedFunnelRuleRule {
  check(item: BatchedFunnelRule): string[];
}

export class BatchedFunnelRuleOpenRateRangeRule implements BatchedFunnelRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFunnelRule): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedFunnelRuleCodePrefixRule implements BatchedFunnelRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFunnelRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFunnelRuleRequiredNameRule implements BatchedFunnelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFunnelRuleImpressionsRangeRule implements BatchedFunnelRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFunnelRule): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedFunnelRuleRequiredCodeRule implements BatchedFunnelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched funnel rule. */
export class BatchedFunnelRuleValidator {
  rules: BatchedFunnelRuleRule[];

  constructor(rules: BatchedFunnelRuleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFunnelRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFunnelRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFunnelRule[]): Map<string, string[]> {
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

export function defaultBatchedFunnelRuleValidator(): BatchedFunnelRuleValidator {
  return new BatchedFunnelRuleValidator(
    [
      new BatchedFunnelRuleOpenRateRangeRule(1.4, 3765.5),
      new BatchedFunnelRuleCodePrefixRule("Q"),
      new BatchedFunnelRuleRequiredNameRule("batched funnel rule needs a value"),
      new BatchedFunnelRuleImpressionsRangeRule(32, 120),
      new BatchedFunnelRuleRequiredCodeRule("batched funnel rule needs an entry"),
    ],
  );
}
