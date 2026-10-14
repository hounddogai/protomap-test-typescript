import * as text from "../../../../kit/text.js";
import { BranchRequest } from "./branch-request.js";

/** A rule a branch request must pass. Check returns its problems, or none. */
export interface BranchRequestRule {
  check(item: BranchRequest): string[];
}

export class BranchRequestCountryLengthRule implements BranchRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchRequest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchRequestRequiredCodeRule implements BranchRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchRequestAllowedNotesRule implements BranchRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is expired`];
    return [];
  }
}

export class BranchRequestWeightRangeRule implements BranchRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchRequest): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchRequestCodeLengthRule implements BranchRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchRequestNotesLengthRule implements BranchRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchRequest): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch request. */
export class BranchRequestValidator {
  rules: BranchRequestRule[];

  constructor(rules: BranchRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BranchRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchRequest[]): Map<string, string[]> {
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

export function defaultBranchRequestValidator(): BranchRequestValidator {
  return new BranchRequestValidator(
    [
      new BranchRequestCountryLengthRule(32),
      new BranchRequestRequiredCodeRule("branch request needs this field"),
      new BranchRequestAllowedNotesRule(["capped", "rolling", "primary"]),
      new BranchRequestWeightRangeRule(0.2, 684.1),
      new BranchRequestCodeLengthRule(1000),
      new BranchRequestNotesLengthRule(64),
    ],
  );
}
