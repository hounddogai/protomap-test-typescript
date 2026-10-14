import * as text from "../../../../kit/text.js";
import { DefaultProofWindow } from "./default-proof-window.js";

/** A rule a default proof window must pass. Check returns its problems, or none. */
export interface DefaultProofWindowRule {
  check(item: DefaultProofWindow): string[];
}

export class DefaultProofWindowWindowDaysRangeRule implements DefaultProofWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultProofWindow): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultProofWindowClicksRangeRule implements DefaultProofWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultProofWindow): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultProofWindowAllowedUtmSourceRule implements DefaultProofWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultProofWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is out of range`];
    return [];
  }
}

export class DefaultProofWindowCodeLengthRule implements DefaultProofWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultProofWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultProofWindowRequiredNameRule implements DefaultProofWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultProofWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultProofWindowRequiredDescriptionRule implements DefaultProofWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultProofWindow): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default proof window. */
export class DefaultProofWindowValidator {
  rules: DefaultProofWindowRule[];

  constructor(rules: DefaultProofWindowRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultProofWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultProofWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultProofWindow[]): Map<string, string[]> {
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

export function defaultDefaultProofWindowValidator(): DefaultProofWindowValidator {
  return new DefaultProofWindowValidator(
    [
      new DefaultProofWindowWindowDaysRangeRule(120, 1000),
      new DefaultProofWindowClicksRangeRule(16, 32),
      new DefaultProofWindowAllowedUtmSourceRule(["strict", "lenient"]),
      new DefaultProofWindowCodeLengthRule(80),
      new DefaultProofWindowRequiredNameRule("default proof window needs a value"),
      new DefaultProofWindowRequiredDescriptionRule("default proof window needs an entry"),
    ],
  );
}
