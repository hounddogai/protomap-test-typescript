import { TieredBounceRequest } from "./tiered-bounce-request.js";

/** A rule a tiered bounce request must pass. Check returns its problems, or none. */
export interface TieredBounceRequestRule {
  check(item: TieredBounceRequest): string[];
}

export class TieredBounceRequestSequenceRangeRule implements TieredBounceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceRequest): string[] {
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

export class TieredBounceRequestRequiredTitleRule implements TieredBounceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceRequestQuantityRangeRule implements TieredBounceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceRequest): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredBounceRequestCategoryLengthRule implements TieredBounceRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceRequest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBounceRequestTitleLengthRule implements TieredBounceRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBounceRequestCodePrefixRule implements TieredBounceRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredBounceRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered bounce request. */
export class TieredBounceRequestValidator {
  rules: TieredBounceRequestRule[];

  constructor(rules: TieredBounceRequestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBounceRequest): string[] {
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

  requireValid(item: TieredBounceRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBounceRequest[]): Map<string, string[]> {
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

export function defaultTieredBounceRequestValidator(): TieredBounceRequestValidator {
  return new TieredBounceRequestValidator(
    [
      new TieredBounceRequestSequenceRangeRule(64, 80),
      new TieredBounceRequestRequiredTitleRule("tiered bounce request needs this field"),
      new TieredBounceRequestQuantityRangeRule(80, 255),
      new TieredBounceRequestCategoryLengthRule(32),
      new TieredBounceRequestTitleLengthRule(120),
      new TieredBounceRequestCodePrefixRule("ACM"),
    ],
  );
}
