import * as text from "../../../../kit/text.js";
import { PendingFrequencyCycle } from "./pending-frequency-cycle.js";

/** A rule a pending frequency cycle must pass. Check returns its problems, or none. */
export interface PendingFrequencyCycleRule {
  check(item: PendingFrequencyCycle): string[];
}

export class PendingFrequencyCycleRequiredCountryRule implements PendingFrequencyCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFrequencyCycle): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFrequencyCycleAllowedTitleRule implements PendingFrequencyCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingFrequencyCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class PendingFrequencyCycleCountryLengthRule implements PendingFrequencyCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyCycle): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyCycleTitleLengthRule implements PendingFrequencyCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyCycleRequiredCodeRule implements PendingFrequencyCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFrequencyCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFrequencyCycleCodeLengthRule implements PendingFrequencyCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending frequency cycle. */
export class PendingFrequencyCycleValidator {
  rules: PendingFrequencyCycleRule[];

  constructor(rules: PendingFrequencyCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFrequencyCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingFrequencyCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFrequencyCycle[]): Map<string, string[]> {
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

export function defaultPendingFrequencyCycleValidator(): PendingFrequencyCycleValidator {
  return new PendingFrequencyCycleValidator(
    [
      new PendingFrequencyCycleRequiredCountryRule("pending frequency cycle needs an entry"),
      new PendingFrequencyCycleAllowedTitleRule(["strict", "lenient"]),
      new PendingFrequencyCycleCountryLengthRule(86400),
      new PendingFrequencyCycleTitleLengthRule(32),
      new PendingFrequencyCycleRequiredCodeRule("pending frequency cycle needs an entry"),
      new PendingFrequencyCycleCodeLengthRule(120),
    ],
  );
}
