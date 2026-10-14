import { TieredLevelRequest } from "./tiered-level-request.js";

/** A rule a tiered level request must pass. Check returns its problems, or none. */
export interface TieredLevelRequestRule {
  check(item: TieredLevelRequest): string[];
}

export class TieredLevelRequestCodeLengthRule implements TieredLevelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLevelRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLevelRequestRequiredNameRule implements TieredLevelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLevelRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLevelRequestRequiredCodeRule implements TieredLevelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLevelRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLevelRequestCategoryLengthRule implements TieredLevelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLevelRequest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered level request. */
export class TieredLevelRequestValidator {
  rules: TieredLevelRequestRule[];

  constructor(rules: TieredLevelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLevelRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredLevelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLevelRequest[]): Map<string, string[]> {
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

export function defaultTieredLevelRequestValidator(): TieredLevelRequestValidator {
  return new TieredLevelRequestValidator(
    [
      new TieredLevelRequestCodeLengthRule(16),
      new TieredLevelRequestRequiredNameRule("tiered level request needs a value"),
      new TieredLevelRequestRequiredCodeRule("tiered level request needs this field"),
      new TieredLevelRequestCategoryLengthRule(32),
    ],
  );
}
