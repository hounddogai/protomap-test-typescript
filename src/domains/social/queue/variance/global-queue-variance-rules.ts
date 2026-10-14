import { GlobalQueueVariance } from "./global-queue-variance.js";

/** A rule a global queue variance must pass. Check returns its problems, or none. */
export interface GlobalQueueVarianceRule {
  check(item: GlobalQueueVariance): string[];
}

export class GlobalQueueVarianceGraceDaysRangeRule implements GlobalQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalQueueVariance): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalQueueVarianceContactEmailLengthRule implements GlobalQueueVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalQueueVariance): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalQueueVarianceFrequencyCapRangeRule implements GlobalQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalQueueVariance): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalQueueVarianceCodePrefixRule implements GlobalQueueVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalQueueVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalQueueVarianceMaximumRangeRule implements GlobalQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalQueueVariance): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalQueueVarianceRequiredCodeRule implements GlobalQueueVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalQueueVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global queue variance. */
export class GlobalQueueVarianceValidator {
  rules: GlobalQueueVarianceRule[];

  constructor(rules: GlobalQueueVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalQueueVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalQueueVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalQueueVariance[]): Map<string, string[]> {
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

export function defaultGlobalQueueVarianceValidator(): GlobalQueueVarianceValidator {
  return new GlobalQueueVarianceValidator(
    [
      new GlobalQueueVarianceGraceDaysRangeRule(16, 3600),
      new GlobalQueueVarianceContactEmailLengthRule(255),
      new GlobalQueueVarianceFrequencyCapRangeRule(16, 86400),
      new GlobalQueueVarianceCodePrefixRule("X"),
      new GlobalQueueVarianceMaximumRangeRule(7.2, 4563.4),
      new GlobalQueueVarianceRequiredCodeRule("global queue variance needs an entry"),
    ],
  );
}
