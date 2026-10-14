import { FallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

/** A rule a fallback reward rule request must pass. Check returns its problems, or none. */
export interface FallbackRewardRuleRequestRule {
  check(item: FallbackRewardRuleRequest): string[];
}

export class FallbackRewardRuleRequestCountryLengthRule implements FallbackRewardRuleRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardRuleRequest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRewardRuleRequestRequiredCodeRule implements FallbackRewardRuleRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardRuleRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardRuleRequestSequenceRangeRule implements FallbackRewardRuleRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRewardRuleRequest): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback reward rule request. */
export class FallbackRewardRuleRequestValidator {
  rules: FallbackRewardRuleRequestRule[];

  constructor(rules: FallbackRewardRuleRequestRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardRuleRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRewardRuleRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardRuleRequest[]): Map<string, string[]> {
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

export function defaultFallbackRewardRuleRequestValidator(): FallbackRewardRuleRequestValidator {
  return new FallbackRewardRuleRequestValidator(
    [
      new FallbackRewardRuleRequestCountryLengthRule(255),
      new FallbackRewardRuleRequestRequiredCodeRule("fallback reward rule request needs an entry"),
      new FallbackRewardRuleRequestSequenceRangeRule(1000, 86400),
    ],
  );
}
