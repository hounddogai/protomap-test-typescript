import { DefaultOptOutRule } from "./default-opt-out-rule.js";

/** A rule a default opt out rule must pass. Check returns its problems, or none. */
export interface DefaultOptOutRuleRule {
  check(item: DefaultOptOutRule): string[];
}

export class DefaultOptOutRuleMarginRangeRule implements DefaultOptOutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultOptOutRule): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultOptOutRuleChannelLengthRule implements DefaultOptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultOptOutRule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultOptOutRuleExpiresAtRangeRule implements DefaultOptOutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultOptOutRule): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultOptOutRuleNameLengthRule implements DefaultOptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultOptOutRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultOptOutRuleCodeLengthRule implements DefaultOptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultOptOutRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default opt out rule. */
export class DefaultOptOutRuleValidator {
  rules: DefaultOptOutRuleRule[];

  constructor(rules: DefaultOptOutRuleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultOptOutRule): string[] {
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

  requireValid(item: DefaultOptOutRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultOptOutRule[]): Map<string, string[]> {
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

export function defaultDefaultOptOutRuleValidator(): DefaultOptOutRuleValidator {
  return new DefaultOptOutRuleValidator(
    [
      new DefaultOptOutRuleMarginRangeRule(3, 2857),
      new DefaultOptOutRuleChannelLengthRule(16),
      new DefaultOptOutRuleExpiresAtRangeRule(255, 3600),
      new DefaultOptOutRuleNameLengthRule(86400),
      new DefaultOptOutRuleCodeLengthRule(80),
    ],
  );
}
