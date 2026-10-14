import * as text from "../../../../kit/text.js";
import { StrictDoubleOptInException } from "./strict-double-opt-in-exception.js";

/** A rule a strict double opt in exception must pass. Check returns its problems, or none. */
export interface StrictDoubleOptInExceptionRule {
  check(item: StrictDoubleOptInException): string[];
}

export class StrictDoubleOptInExceptionCodeLengthRule implements StrictDoubleOptInExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDoubleOptInException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDoubleOptInExceptionChannelLengthRule implements StrictDoubleOptInExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDoubleOptInException): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDoubleOptInExceptionAllowedTitleRule implements StrictDoubleOptInExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictDoubleOptInException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class StrictDoubleOptInExceptionSendAtRangeRule implements StrictDoubleOptInExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictDoubleOptInException): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict double opt in exception. */
export class StrictDoubleOptInExceptionValidator {
  rules: StrictDoubleOptInExceptionRule[];

  constructor(rules: StrictDoubleOptInExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: StrictDoubleOptInException): string[] {
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

  requireValid(item: StrictDoubleOptInException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictDoubleOptInException[]): Map<string, string[]> {
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

export function defaultStrictDoubleOptInExceptionValidator(): StrictDoubleOptInExceptionValidator {
  return new StrictDoubleOptInExceptionValidator(
    [
      new StrictDoubleOptInExceptionCodeLengthRule(64),
      new StrictDoubleOptInExceptionChannelLengthRule(3600),
      new StrictDoubleOptInExceptionAllowedTitleRule([]),
      new StrictDoubleOptInExceptionSendAtRangeRule(64, 3600),
    ],
  );
}
