import { WaitRule } from "./wait-rule.js";

/** A rule a wait rule must pass. Check returns its problems, or none. */
export interface WaitRuleRule {
  check(item: WaitRule): string[];
}

export class WaitRuleCohortLengthRule implements WaitRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitRule): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitRuleMaximumRangeRule implements WaitRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitRule): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitRuleAmountRangeRule implements WaitRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitRule): string[] {
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

export class WaitRuleCodePrefixRule implements WaitRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitRuleRegionLengthRule implements WaitRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitRule): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitRuleRequiredRegionRule implements WaitRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitRule): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait rule. */
export class WaitRuleValidator {
  rules: WaitRuleRule[];

  constructor(rules: WaitRuleRule[]) {
    this.rules = rules;
  }

  validate(item: WaitRule): string[] {
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

  requireValid(item: WaitRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitRule[]): Map<string, string[]> {
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

export function defaultWaitRuleValidator(): WaitRuleValidator {
  return new WaitRuleValidator(
    [
      new WaitRuleCohortLengthRule(16),
      new WaitRuleMaximumRangeRule(6.4, 4559.4),
      new WaitRuleAmountRangeRule(6, 444.1),
      new WaitRuleCodePrefixRule("OPS"),
      new WaitRuleRegionLengthRule(80),
      new WaitRuleRequiredRegionRule("wait rule needs this field"),
    ],
  );
}
