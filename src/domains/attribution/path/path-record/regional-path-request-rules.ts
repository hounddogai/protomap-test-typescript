import { RegionalPathRequest } from "./regional-path-request.js";

/** A rule a regional path request must pass. Check returns its problems, or none. */
export interface RegionalPathRequestRule {
  check(item: RegionalPathRequest): string[];
}

export class RegionalPathRequestCapacityRangeRule implements RegionalPathRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPathRequest): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPathRequestRequiredNameRule implements RegionalPathRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPathRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPathRequestRequiredCodeRule implements RegionalPathRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPathRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPathRequestCodeLengthRule implements RegionalPathRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPathRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPathRequestRequiredCategoryRule implements RegionalPathRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPathRequest): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional path request. */
export class RegionalPathRequestValidator {
  rules: RegionalPathRequestRule[];

  constructor(rules: RegionalPathRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPathRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPathRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPathRequest[]): Map<string, string[]> {
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

export function defaultRegionalPathRequestValidator(): RegionalPathRequestValidator {
  return new RegionalPathRequestValidator(
    [
      new RegionalPathRequestCapacityRangeRule(1000, 86400),
      new RegionalPathRequestRequiredNameRule("regional path request needs this field"),
      new RegionalPathRequestRequiredCodeRule("regional path request needs this field"),
      new RegionalPathRequestCodeLengthRule(1000),
      new RegionalPathRequestRequiredCategoryRule("regional path request needs a value"),
    ],
  );
}
