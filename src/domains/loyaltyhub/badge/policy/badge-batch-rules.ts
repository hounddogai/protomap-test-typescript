import { BadgeBatch } from "./badge-batch.js";

/** A rule a badge batch must pass. Check returns its problems, or none. */
export interface BadgeBatchRule {
  check(item: BadgeBatch): string[];
}

export class BadgeBatchRequiredCampaignRefRule implements BadgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeBatch): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeBatchCodePrefixRule implements BadgeBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeBatchRequiredNameRule implements BadgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeBatchRequiredCodeRule implements BadgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeBatchUpdatedAtRangeRule implements BadgeBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeBatch): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeBatchNameLengthRule implements BadgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a badge batch. */
export class BadgeBatchValidator {
  rules: BadgeBatchRule[];

  constructor(rules: BadgeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeBatch[]): Map<string, string[]> {
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

export function defaultBadgeBatchValidator(): BadgeBatchValidator {
  return new BadgeBatchValidator(
    [
      new BadgeBatchRequiredCampaignRefRule("badge batch needs an entry"),
      new BadgeBatchCodePrefixRule("Q"),
      new BadgeBatchRequiredNameRule("badge batch needs a value"),
      new BadgeBatchRequiredCodeRule("badge batch needs an entry"),
      new BadgeBatchUpdatedAtRangeRule(120, 3600),
      new BadgeBatchNameLengthRule(3600),
    ],
  );
}
