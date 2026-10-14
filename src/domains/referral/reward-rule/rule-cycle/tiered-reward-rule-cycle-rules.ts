import { TieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

/** A rule a tiered reward rule cycle must pass. Check returns its problems, or none. */
export interface TieredRewardRuleCycleRule {
  check(item: TieredRewardRuleCycle): string[];
}

export class TieredRewardRuleCycleRateRangeRule implements TieredRewardRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleCycle): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredRewardRuleCycleRequiredNameRule implements TieredRewardRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleCycleRequiredAudienceIdRule implements TieredRewardRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleCycle): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleCycleAudienceIdLengthRule implements TieredRewardRuleCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardRuleCycle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardRuleCycleRequiredCodeRule implements TieredRewardRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered reward rule cycle. */
export class TieredRewardRuleCycleValidator {
  rules: TieredRewardRuleCycleRule[];

  constructor(rules: TieredRewardRuleCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardRuleCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRewardRuleCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardRuleCycle[]): Map<string, string[]> {
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

export function defaultTieredRewardRuleCycleValidator(): TieredRewardRuleCycleValidator {
  return new TieredRewardRuleCycleValidator(
    [
      new TieredRewardRuleCycleRateRangeRule(0, 4684.2),
      new TieredRewardRuleCycleRequiredNameRule("tiered reward rule cycle needs this field"),
      new TieredRewardRuleCycleRequiredAudienceIdRule("tiered reward rule cycle needs this field"),
      new TieredRewardRuleCycleAudienceIdLengthRule(32),
      new TieredRewardRuleCycleRequiredCodeRule("tiered reward rule cycle needs this field"),
    ],
  );
}
