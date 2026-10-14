import { GlobalSlaCycle } from "./global-sla-cycle.js";

/** A rule a global sla cycle must pass. Check returns its problems, or none. */
export interface GlobalSlaCycleRule {
  check(item: GlobalSlaCycle): string[];
}

export class GlobalSlaCycleUpdatedAtRangeRule implements GlobalSlaCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSlaCycle): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSlaCycleClicksRangeRule implements GlobalSlaCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSlaCycle): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSlaCycleCodePrefixRule implements GlobalSlaCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalSlaCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalSlaCycleBudgetRangeRule implements GlobalSlaCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSlaCycle): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSlaCycleCodeLengthRule implements GlobalSlaCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSlaCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global sla cycle. */
export class GlobalSlaCycleValidator {
  rules: GlobalSlaCycleRule[];

  constructor(rules: GlobalSlaCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSlaCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSlaCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSlaCycle[]): Map<string, string[]> {
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

export function defaultGlobalSlaCycleValidator(): GlobalSlaCycleValidator {
  return new GlobalSlaCycleValidator(
    [
      new GlobalSlaCycleUpdatedAtRangeRule(3600, 86400),
      new GlobalSlaCycleClicksRangeRule(80, 255),
      new GlobalSlaCycleCodePrefixRule("X"),
      new GlobalSlaCycleBudgetRangeRule(8.4, 3663.1),
      new GlobalSlaCycleCodeLengthRule(64),
    ],
  );
}
