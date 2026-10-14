import { RollingBidRuleBatch } from "./rolling-bid-rule-batch.js";

/** A rule a rolling bid rule batch must pass. Check returns its problems, or none. */
export interface RollingBidRuleBatchRule {
  check(item: RollingBidRuleBatch): string[];
}

export class RollingBidRuleBatchRegionLengthRule implements RollingBidRuleBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleBatch): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBidRuleBatchCodePrefixRule implements RollingBidRuleBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingBidRuleBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingBidRuleBatchSequenceRangeRule implements RollingBidRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBidRuleBatch): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingBidRuleBatchRequiredRegionRule implements RollingBidRuleBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBidRuleBatch): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBidRuleBatchCodeLengthRule implements RollingBidRuleBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBidRuleBatchOwnerIdLengthRule implements RollingBidRuleBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleBatch): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling bid rule batch. */
export class RollingBidRuleBatchValidator {
  rules: RollingBidRuleBatchRule[];

  constructor(rules: RollingBidRuleBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBidRuleBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingBidRuleBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBidRuleBatch[]): Map<string, string[]> {
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

export function defaultRollingBidRuleBatchValidator(): RollingBidRuleBatchValidator {
  return new RollingBidRuleBatchValidator(
    [
      new RollingBidRuleBatchRegionLengthRule(1000),
      new RollingBidRuleBatchCodePrefixRule("REF"),
      new RollingBidRuleBatchSequenceRangeRule(120, 1000),
      new RollingBidRuleBatchRequiredRegionRule("rolling bid rule batch needs this field"),
      new RollingBidRuleBatchCodeLengthRule(255),
      new RollingBidRuleBatchOwnerIdLengthRule(16),
    ],
  );
}
