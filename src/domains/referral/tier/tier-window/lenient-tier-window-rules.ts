import { LenientTierWindow } from "./lenient-tier-window.js";

/** A rule a lenient tier window must pass. Check returns its problems, or none. */
export interface LenientTierWindowRule {
  check(item: LenientTierWindow): string[];
}

export class LenientTierWindowSequenceRangeRule implements LenientTierWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTierWindow): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientTierWindowTagsLimitRule implements LenientTierWindowRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LenientTierWindow): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class LenientTierWindowCostRangeRule implements LenientTierWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTierWindow): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientTierWindowDiscountRangeRule implements LenientTierWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTierWindow): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientTierWindowNameLengthRule implements LenientTierWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientTierWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient tier window. */
export class LenientTierWindowValidator {
  rules: LenientTierWindowRule[];

  constructor(rules: LenientTierWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTierWindow): string[] {
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

  requireValid(item: LenientTierWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTierWindow[]): Map<string, string[]> {
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

export function defaultLenientTierWindowValidator(): LenientTierWindowValidator {
  return new LenientTierWindowValidator(
    [
      new LenientTierWindowSequenceRangeRule(1000, 1000),
      new LenientTierWindowTagsLimitRule(120, ["primary", "seasonal", "weighted"]),
      new LenientTierWindowCostRangeRule(3.9, 4095.6),
      new LenientTierWindowDiscountRangeRule(0.5, 1992.5),
      new LenientTierWindowNameLengthRule(32),
    ],
  );
}
