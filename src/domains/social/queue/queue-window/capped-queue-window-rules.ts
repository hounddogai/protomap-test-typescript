import * as text from "../../../../kit/text.js";
import { CappedQueueWindow } from "./capped-queue-window.js";

/** A rule a capped queue window must pass. Check returns its problems, or none. */
export interface CappedQueueWindowRule {
  check(item: CappedQueueWindow): string[];
}

export class CappedQueueWindowNameLengthRule implements CappedQueueWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedQueueWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedQueueWindowRequiredCodeRule implements CappedQueueWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedQueueWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedQueueWindowAllowedNameRule implements CappedQueueWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedQueueWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class CappedQueueWindowRateRangeRule implements CappedQueueWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedQueueWindow): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedQueueWindowRequiredNameRule implements CappedQueueWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedQueueWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped queue window. */
export class CappedQueueWindowValidator {
  rules: CappedQueueWindowRule[];

  constructor(rules: CappedQueueWindowRule[]) {
    this.rules = rules;
  }

  validate(item: CappedQueueWindow): string[] {
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

  requireValid(item: CappedQueueWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedQueueWindow[]): Map<string, string[]> {
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

export function defaultCappedQueueWindowValidator(): CappedQueueWindowValidator {
  return new CappedQueueWindowValidator(
    [
      new CappedQueueWindowNameLengthRule(16),
      new CappedQueueWindowRequiredCodeRule("capped queue window needs this field"),
      new CappedQueueWindowAllowedNameRule(["pending", "regional", "strict"]),
      new CappedQueueWindowRateRangeRule(8.7, 4349.7),
      new CappedQueueWindowRequiredNameRule("capped queue window needs this field"),
    ],
  );
}
