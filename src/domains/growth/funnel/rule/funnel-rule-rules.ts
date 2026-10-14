import { FunnelRule } from "./funnel-rule.js";

/** A rule a funnel rule must pass. Check returns its problems, or none. */
export interface FunnelRuleRule {
  check(item: FunnelRule): string[];
}

export class FunnelRuleRequiredSourceRule implements FunnelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelRule): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelRuleSourceLengthRule implements FunnelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRule): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRuleRequiredAudienceIdRule implements FunnelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelRule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelRuleBatchSizeRangeRule implements FunnelRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelRule): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelRuleCodeLengthRule implements FunnelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRuleWindowDaysRangeRule implements FunnelRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelRule): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a funnel rule. */
export class FunnelRuleValidator {
  rules: FunnelRuleRule[];

  constructor(rules: FunnelRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelRule): string[] {
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

  requireValid(item: FunnelRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelRule[]): Map<string, string[]> {
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

export function defaultFunnelRuleValidator(): FunnelRuleValidator {
  return new FunnelRuleValidator(
    [
      new FunnelRuleRequiredSourceRule("funnel rule needs this field"),
      new FunnelRuleSourceLengthRule(80),
      new FunnelRuleRequiredAudienceIdRule("funnel rule needs this field"),
      new FunnelRuleBatchSizeRangeRule(64, 255),
      new FunnelRuleCodeLengthRule(64),
      new FunnelRuleWindowDaysRangeRule(80, 255),
    ],
  );
}
