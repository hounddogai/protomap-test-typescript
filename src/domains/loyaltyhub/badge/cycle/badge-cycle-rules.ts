import { BadgeCycle } from "./badge-cycle.js";

/** A rule a badge cycle must pass. Check returns its problems, or none. */
export interface BadgeCycleRule {
  check(item: BadgeCycle): string[];
}

export class BadgeCycleDescriptionLengthRule implements BadgeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeCycle): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeCycleOpenRateRangeRule implements BadgeCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeCycle): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeCycleRequiredCodeRule implements BadgeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeCycleLabelLengthRule implements BadgeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeCycleCodePrefixRule implements BadgeCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a badge cycle. */
export class BadgeCycleValidator {
  rules: BadgeCycleRule[];

  constructor(rules: BadgeCycleRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeCycle[]): Map<string, string[]> {
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

export function defaultBadgeCycleValidator(): BadgeCycleValidator {
  return new BadgeCycleValidator(
    [
      new BadgeCycleDescriptionLengthRule(1000),
      new BadgeCycleOpenRateRangeRule(9.9, 1769.4),
      new BadgeCycleRequiredCodeRule("badge cycle needs a value"),
      new BadgeCycleLabelLengthRule(120),
      new BadgeCycleCodePrefixRule("ACM"),
    ],
  );
}
