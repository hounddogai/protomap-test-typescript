import { WindowRule } from "./window-rule.js";

/** A rule a window rule must pass. Check returns its problems, or none. */
export interface WindowRuleRule {
  check(item: WindowRule): string[];
}

export class WindowRuleCodePrefixRule implements WindowRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowRuleNameLengthRule implements WindowRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowRuleQuantityRangeRule implements WindowRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowRule): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowRuleRequiredCohortRule implements WindowRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowRule): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window rule. */
export class WindowRuleValidator {
  rules: WindowRuleRule[];

  constructor(rules: WindowRuleRule[]) {
    this.rules = rules;
  }

  validate(item: WindowRule): string[] {
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

  requireValid(item: WindowRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowRule[]): Map<string, string[]> {
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

export function defaultWindowRuleValidator(): WindowRuleValidator {
  return new WindowRuleValidator(
    [
      new WindowRuleCodePrefixRule("REF"),
      new WindowRuleNameLengthRule(86400),
      new WindowRuleQuantityRangeRule(120, 120),
      new WindowRuleRequiredCohortRule("window rule needs a value"),
    ],
  );
}
