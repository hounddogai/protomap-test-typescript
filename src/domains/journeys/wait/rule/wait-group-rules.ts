import { WaitGroup } from "./wait-group.js";

/** A rule a wait group must pass. Check returns its problems, or none. */
export interface WaitGroupRule {
  check(item: WaitGroup): string[];
}

export class WaitGroupRequiredCodeRule implements WaitGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitGroupScoreRangeRule implements WaitGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitGroup): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitGroupCodePrefixRule implements WaitGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitGroupRequiredTitleRule implements WaitGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitGroupTitleLengthRule implements WaitGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitGroupLabelLengthRule implements WaitGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait group. */
export class WaitGroupValidator {
  rules: WaitGroupRule[];

  constructor(rules: WaitGroupRule[]) {
    this.rules = rules;
  }

  validate(item: WaitGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitGroup[]): Map<string, string[]> {
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

export function defaultWaitGroupValidator(): WaitGroupValidator {
  return new WaitGroupValidator(
    [
      new WaitGroupRequiredCodeRule("wait group needs this field"),
      new WaitGroupScoreRangeRule(7, 4381.5),
      new WaitGroupCodePrefixRule("OPS"),
      new WaitGroupRequiredTitleRule("wait group needs a value"),
      new WaitGroupTitleLengthRule(64),
      new WaitGroupLabelLengthRule(86400),
    ],
  );
}
