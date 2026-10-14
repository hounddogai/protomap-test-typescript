import { PrimarySenderRule } from "./primary-sender-rule.js";

/** A rule a primary sender rule must pass. Check returns its problems, or none. */
export interface PrimarySenderRuleRule {
  check(item: PrimarySenderRule): string[];
}

export class PrimarySenderRuleCodePrefixRule implements PrimarySenderRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySenderRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimarySenderRuleRequiredPhoneRule implements PrimarySenderRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderRule): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySenderRuleRequiredTitleRule implements PrimarySenderRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySenderRuleClicksRangeRule implements PrimarySenderRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySenderRule): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimarySenderRulePhoneLengthRule implements PrimarySenderRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderRule): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary sender rule. */
export class PrimarySenderRuleValidator {
  rules: PrimarySenderRuleRule[];

  constructor(rules: PrimarySenderRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySenderRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySenderRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySenderRule[]): Map<string, string[]> {
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

export function defaultPrimarySenderRuleValidator(): PrimarySenderRuleValidator {
  return new PrimarySenderRuleValidator(
    [
      new PrimarySenderRuleCodePrefixRule("REF"),
      new PrimarySenderRuleRequiredPhoneRule("primary sender rule needs this field"),
      new PrimarySenderRuleRequiredTitleRule("primary sender rule needs an entry"),
      new PrimarySenderRuleClicksRangeRule(16, 86400),
      new PrimarySenderRulePhoneLengthRule(32),
    ],
  );
}
