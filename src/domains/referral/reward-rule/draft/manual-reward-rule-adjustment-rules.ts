import { ManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

/** A rule a manual reward rule adjustment must pass. Check returns its problems, or none. */
export interface ManualRewardRuleAdjustmentRule {
  check(item: ManualRewardRuleAdjustment): string[];
}

export class ManualRewardRuleAdjustmentCodePrefixRule implements ManualRewardRuleAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualRewardRuleAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualRewardRuleAdjustmentRequiredCodeRule implements ManualRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRewardRuleAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRewardRuleAdjustmentQuantityRangeRule implements ManualRewardRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRewardRuleAdjustment): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualRewardRuleAdjustmentCodeLengthRule implements ManualRewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRuleAdjustmentRequiredRegionRule implements ManualRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRewardRuleAdjustment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual reward rule adjustment. */
export class ManualRewardRuleAdjustmentValidator {
  rules: ManualRewardRuleAdjustmentRule[];

  constructor(rules: ManualRewardRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRewardRuleAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRewardRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRewardRuleAdjustment[]): Map<string, string[]> {
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

export function defaultManualRewardRuleAdjustmentValidator(): ManualRewardRuleAdjustmentValidator {
  return new ManualRewardRuleAdjustmentValidator(
    [
      new ManualRewardRuleAdjustmentCodePrefixRule("ACM"),
      new ManualRewardRuleAdjustmentRequiredCodeRule("manual reward rule adjustment needs an entry"),
      new ManualRewardRuleAdjustmentQuantityRangeRule(120, 1000),
      new ManualRewardRuleAdjustmentCodeLengthRule(1000),
      new ManualRewardRuleAdjustmentRequiredRegionRule("manual reward rule adjustment needs a value"),
    ],
  );
}
