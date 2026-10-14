import * as text from "../../../../kit/text.js";
import { GlobalChallengeCycle } from "./global-challenge-cycle.js";

/** A rule a global challenge cycle must pass. Check returns its problems, or none. */
export interface GlobalChallengeCycleRule {
  check(item: GlobalChallengeCycle): string[];
}

export class GlobalChallengeCycleTitleLengthRule implements GlobalChallengeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalChallengeCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalChallengeCycleRequiredNameRule implements GlobalChallengeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalChallengeCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalChallengeCycleAllowedTitleRule implements GlobalChallengeCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalChallengeCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class GlobalChallengeCycleRateRangeRule implements GlobalChallengeCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalChallengeCycle): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalChallengeCycleRequiredCodeRule implements GlobalChallengeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalChallengeCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global challenge cycle. */
export class GlobalChallengeCycleValidator {
  rules: GlobalChallengeCycleRule[];

  constructor(rules: GlobalChallengeCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalChallengeCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalChallengeCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalChallengeCycle[]): Map<string, string[]> {
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

export function defaultGlobalChallengeCycleValidator(): GlobalChallengeCycleValidator {
  return new GlobalChallengeCycleValidator(
    [
      new GlobalChallengeCycleTitleLengthRule(120),
      new GlobalChallengeCycleRequiredNameRule("global challenge cycle needs a value"),
      new GlobalChallengeCycleAllowedTitleRule(["batched"]),
      new GlobalChallengeCycleRateRangeRule(1.9, 1717),
      new GlobalChallengeCycleRequiredCodeRule("global challenge cycle needs this field"),
    ],
  );
}
