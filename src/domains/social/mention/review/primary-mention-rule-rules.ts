import { PrimaryMentionRule } from "./primary-mention-rule.js";

/** A rule a primary mention rule must pass. Check returns its problems, or none. */
export interface PrimaryMentionRuleRule {
  check(item: PrimaryMentionRule): string[];
}

export class PrimaryMentionRuleCapacityRangeRule implements PrimaryMentionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryMentionRule): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryMentionRuleArchivedGuardRule implements PrimaryMentionRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryMentionRule): string[] {
    if (item.archived && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PrimaryMentionRuleCodeLengthRule implements PrimaryMentionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMentionRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMentionRuleVersionRangeRule implements PrimaryMentionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryMentionRule): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryMentionRuleLocaleLengthRule implements PrimaryMentionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMentionRule): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMentionRuleRequiredSegmentRule implements PrimaryMentionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMentionRule): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary mention rule. */
export class PrimaryMentionRuleValidator {
  rules: PrimaryMentionRuleRule[];

  constructor(rules: PrimaryMentionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryMentionRule): string[] {
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

  requireValid(item: PrimaryMentionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryMentionRule[]): Map<string, string[]> {
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

export function defaultPrimaryMentionRuleValidator(): PrimaryMentionRuleValidator {
  return new PrimaryMentionRuleValidator(
    [
      new PrimaryMentionRuleCapacityRangeRule(255, 3600),
      new PrimaryMentionRuleArchivedGuardRule(7.1),
      new PrimaryMentionRuleCodeLengthRule(86400),
      new PrimaryMentionRuleVersionRangeRule(16, 120),
      new PrimaryMentionRuleLocaleLengthRule(86400),
      new PrimaryMentionRuleRequiredSegmentRule("primary mention rule needs a value"),
    ],
  );
}
