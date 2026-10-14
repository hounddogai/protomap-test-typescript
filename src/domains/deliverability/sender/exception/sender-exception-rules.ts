import * as text from "../../../../kit/text.js";
import { SenderException } from "./sender-exception.js";

/** A rule a sender exception must pass. Check returns its problems, or none. */
export interface SenderExceptionRule {
  check(item: SenderException): string[];
}

export class SenderExceptionRequiredLocaleRule implements SenderExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderException): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SenderExceptionCostRangeRule implements SenderExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderException): string[] {
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

export class SenderExceptionAllowedLabelRule implements SenderExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class SenderExceptionRequiredLabelRule implements SenderExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender exception. */
export class SenderExceptionValidator {
  rules: SenderExceptionRule[];

  constructor(rules: SenderExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: SenderException): string[] {
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

  requireValid(item: SenderException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderException[]): Map<string, string[]> {
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

export function defaultSenderExceptionValidator(): SenderExceptionValidator {
  return new SenderExceptionValidator(
    [
      new SenderExceptionRequiredLocaleRule("sender exception needs an entry"),
      new SenderExceptionCostRangeRule(8, 1076),
      new SenderExceptionAllowedLabelRule(["rolling", "tiered"]),
      new SenderExceptionRequiredLabelRule("sender exception needs an entry"),
    ],
  );
}
