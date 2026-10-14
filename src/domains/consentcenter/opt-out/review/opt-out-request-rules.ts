import { OptOutRequest } from "./opt-out-request.js";

/** A rule a opt out request must pass. Check returns its problems, or none. */
export interface OptOutRequestRule {
  check(item: OptOutRequest): string[];
}

export class OptOutRequestCostRangeRule implements OptOutRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutRequest): string[] {
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

export class OptOutRequestCodeLengthRule implements OptOutRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutRequestRequiredCodeRule implements OptOutRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutRequestCodePrefixRule implements OptOutRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutRequestRequiredRegionRule implements OptOutRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutRequest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutRequestTitleLengthRule implements OptOutRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a opt out request. */
export class OptOutRequestValidator {
  rules: OptOutRequestRule[];

  constructor(rules: OptOutRequestRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutRequest[]): Map<string, string[]> {
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

export function defaultOptOutRequestValidator(): OptOutRequestValidator {
  return new OptOutRequestValidator(
    [
      new OptOutRequestCostRangeRule(3.2, 1787.5),
      new OptOutRequestCodeLengthRule(32),
      new OptOutRequestRequiredCodeRule("opt out request needs this field"),
      new OptOutRequestCodePrefixRule("ACM"),
      new OptOutRequestRequiredRegionRule("opt out request needs this field"),
      new OptOutRequestTitleLengthRule(32),
    ],
  );
}
