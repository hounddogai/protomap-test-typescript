import { LegacyWaitException } from "./legacy-wait-exception.js";

/** A rule a legacy wait exception must pass. Check returns its problems, or none. */
export interface LegacyWaitExceptionRule {
  check(item: LegacyWaitException): string[];
}

export class LegacyWaitExceptionRequiredCountryRule implements LegacyWaitExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWaitException): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWaitExceptionUpdatedAtRangeRule implements LegacyWaitExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitException): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyWaitExceptionRequiredLabelRule implements LegacyWaitExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWaitException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWaitExceptionCountryLengthRule implements LegacyWaitExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWaitException): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWaitExceptionTagsLimitRule implements LegacyWaitExceptionRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LegacyWaitException): string[] {
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

export class LegacyWaitExceptionQuantityRangeRule implements LegacyWaitExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitException): string[] {
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

/** Runs every rule of a legacy wait exception. */
export class LegacyWaitExceptionValidator {
  rules: LegacyWaitExceptionRule[];

  constructor(rules: LegacyWaitExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWaitException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWaitException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWaitException[]): Map<string, string[]> {
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

export function defaultLegacyWaitExceptionValidator(): LegacyWaitExceptionValidator {
  return new LegacyWaitExceptionValidator(
    [
      new LegacyWaitExceptionRequiredCountryRule("legacy wait exception needs this field"),
      new LegacyWaitExceptionUpdatedAtRangeRule(80, 120),
      new LegacyWaitExceptionRequiredLabelRule("legacy wait exception needs a value"),
      new LegacyWaitExceptionCountryLengthRule(120),
      new LegacyWaitExceptionTagsLimitRule(3600, ["global", "adaptive", "lenient"]),
      new LegacyWaitExceptionQuantityRangeRule(255, 3600),
    ],
  );
}
