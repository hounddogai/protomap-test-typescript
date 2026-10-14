import { PendingExitRuleItem } from "./pending-exit-rule-item.js";

/** A rule a pending exit rule item must pass. Check returns its problems, or none. */
export interface PendingExitRuleItemRule {
  check(item: PendingExitRuleItem): string[];
}

export class PendingExitRuleItemOpenRateRangeRule implements PendingExitRuleItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingExitRuleItem): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingExitRuleItemActiveGuardRule implements PendingExitRuleItemRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingExitRuleItem): string[] {
    if (item.active && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PendingExitRuleItemFrequencyCapRangeRule implements PendingExitRuleItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingExitRuleItem): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingExitRuleItemCountryLengthRule implements PendingExitRuleItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingExitRuleItem): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingExitRuleItemRequiredLabelRule implements PendingExitRuleItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingExitRuleItem): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingExitRuleItemCodeLengthRule implements PendingExitRuleItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingExitRuleItem): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending exit rule item. */
export class PendingExitRuleItemValidator {
  rules: PendingExitRuleItemRule[];

  constructor(rules: PendingExitRuleItemRule[]) {
    this.rules = rules;
  }

  validate(item: PendingExitRuleItem): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingExitRuleItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingExitRuleItem[]): Map<string, string[]> {
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

export function defaultPendingExitRuleItemValidator(): PendingExitRuleItemValidator {
  return new PendingExitRuleItemValidator(
    [
      new PendingExitRuleItemOpenRateRangeRule(4.4, 479.8),
      new PendingExitRuleItemActiveGuardRule(86400),
      new PendingExitRuleItemFrequencyCapRangeRule(16, 80),
      new PendingExitRuleItemCountryLengthRule(64),
      new PendingExitRuleItemRequiredLabelRule("pending exit rule item needs a value"),
      new PendingExitRuleItemCodeLengthRule(32),
    ],
  );
}
