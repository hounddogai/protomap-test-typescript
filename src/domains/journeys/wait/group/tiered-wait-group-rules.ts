import * as text from "../../../../kit/text.js";
import { TieredWaitGroup } from "./tiered-wait-group.js";

/** A rule a tiered wait group must pass. Check returns its problems, or none. */
export interface TieredWaitGroupRule {
  check(item: TieredWaitGroup): string[];
}

export class TieredWaitGroupRequiredCodeRule implements TieredWaitGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWaitGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWaitGroupAllowedNameRule implements TieredWaitGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredWaitGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class TieredWaitGroupCodeLengthRule implements TieredWaitGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWaitGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWaitGroupRequiredPhoneRule implements TieredWaitGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWaitGroup): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered wait group. */
export class TieredWaitGroupValidator {
  rules: TieredWaitGroupRule[];

  constructor(rules: TieredWaitGroupRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWaitGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredWaitGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWaitGroup[]): Map<string, string[]> {
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

export function defaultTieredWaitGroupValidator(): TieredWaitGroupValidator {
  return new TieredWaitGroupValidator(
    [
      new TieredWaitGroupRequiredCodeRule("tiered wait group needs this field"),
      new TieredWaitGroupAllowedNameRule([]),
      new TieredWaitGroupCodeLengthRule(80),
      new TieredWaitGroupRequiredPhoneRule("tiered wait group needs an entry"),
    ],
  );
}
