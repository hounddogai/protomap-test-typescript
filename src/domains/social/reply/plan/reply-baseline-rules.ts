import { ReplyBaseline } from "./reply-baseline.js";

/** A rule a reply baseline must pass. Check returns its problems, or none. */
export interface ReplyBaselineRule {
  check(item: ReplyBaseline): string[];
}

export class ReplyBaselineRequiredNameRule implements ReplyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyBaselineRequiredLabelRule implements ReplyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyBaselineCapacityRangeRule implements ReplyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyBaseline): string[] {
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

export class ReplyBaselineCostRangeRule implements ReplyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyBaseline): string[] {
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

export class ReplyBaselineRequiredCodeRule implements ReplyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyBaselineNameLengthRule implements ReplyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply baseline. */
export class ReplyBaselineValidator {
  rules: ReplyBaselineRule[];

  constructor(rules: ReplyBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyBaseline): string[] {
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

  requireValid(item: ReplyBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyBaseline[]): Map<string, string[]> {
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

export function defaultReplyBaselineValidator(): ReplyBaselineValidator {
  return new ReplyBaselineValidator(
    [
      new ReplyBaselineRequiredNameRule("reply baseline needs this field"),
      new ReplyBaselineRequiredLabelRule("reply baseline needs this field"),
      new ReplyBaselineCapacityRangeRule(32, 120),
      new ReplyBaselineCostRangeRule(7.3, 1662.2),
      new ReplyBaselineRequiredCodeRule("reply baseline needs this field"),
      new ReplyBaselineNameLengthRule(255),
    ],
  );
}
