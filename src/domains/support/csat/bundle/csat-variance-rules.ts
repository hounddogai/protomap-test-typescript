import { CsatVariance } from "./csat-variance.js";

/** A rule a csat variance must pass. Check returns its problems, or none. */
export interface CsatVarianceRule {
  check(item: CsatVariance): string[];
}

export class CsatVarianceRequiredLabelRule implements CsatVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CsatVarianceCodeLengthRule implements CsatVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatVarianceRequiredCodeRule implements CsatVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatVarianceRequiredVariantRule implements CsatVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatVariance): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class CsatVarianceCreatedAtRangeRule implements CsatVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatVariance): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatVarianceTagsLimitRule implements CsatVarianceRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CsatVariance): string[] {
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

/** Runs every rule of a csat variance. */
export class CsatVarianceValidator {
  rules: CsatVarianceRule[];

  constructor(rules: CsatVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: CsatVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatVariance[]): Map<string, string[]> {
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

export function defaultCsatVarianceValidator(): CsatVarianceValidator {
  return new CsatVarianceValidator(
    [
      new CsatVarianceRequiredLabelRule("csat variance needs this field"),
      new CsatVarianceCodeLengthRule(32),
      new CsatVarianceRequiredCodeRule("csat variance needs a value"),
      new CsatVarianceRequiredVariantRule("csat variance needs a value"),
      new CsatVarianceCreatedAtRangeRule(255, 1000),
      new CsatVarianceTagsLimitRule(64, ["primary", "strict"]),
    ],
  );
}
