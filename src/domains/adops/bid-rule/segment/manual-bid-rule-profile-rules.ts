import { ManualBidRuleProfile } from "./manual-bid-rule-profile.js";

/** A rule a manual bid rule profile must pass. Check returns its problems, or none. */
export interface ManualBidRuleProfileRule {
  check(item: ManualBidRuleProfile): string[];
}

export class ManualBidRuleProfileRequiredLabelRule implements ManualBidRuleProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBidRuleProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBidRuleProfileNameLengthRule implements ManualBidRuleProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBidRuleProfileCodePrefixRule implements ManualBidRuleProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBidRuleProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualBidRuleProfileTimezoneLengthRule implements ManualBidRuleProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleProfile): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBidRuleProfileLimitRangeRule implements ManualBidRuleProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleProfile): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual bid rule profile. */
export class ManualBidRuleProfileValidator {
  rules: ManualBidRuleProfileRule[];

  constructor(rules: ManualBidRuleProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBidRuleProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualBidRuleProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBidRuleProfile[]): Map<string, string[]> {
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

export function defaultManualBidRuleProfileValidator(): ManualBidRuleProfileValidator {
  return new ManualBidRuleProfileValidator(
    [
      new ManualBidRuleProfileRequiredLabelRule("manual bid rule profile needs this field"),
      new ManualBidRuleProfileNameLengthRule(16),
      new ManualBidRuleProfileCodePrefixRule("X"),
      new ManualBidRuleProfileTimezoneLengthRule(32),
      new ManualBidRuleProfileLimitRangeRule(255, 86400),
    ],
  );
}
