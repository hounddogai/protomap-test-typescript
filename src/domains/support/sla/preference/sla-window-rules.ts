import * as text from "../../../../kit/text.js";
import { SlaWindow } from "./sla-window.js";

/** A rule a sla window must pass. Check returns its problems, or none. */
export interface SlaWindowRule {
  check(item: SlaWindow): string[];
}

export class SlaWindowClicksRangeRule implements SlaWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaWindow): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaWindowAllowedReviewerRule implements SlaWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is missing`];
    return [];
  }
}

export class SlaWindowMaximumRangeRule implements SlaWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaWindow): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaWindowRequiredCodeRule implements SlaWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaWindowCodeLengthRule implements SlaWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaWindowBidRangeRule implements SlaWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaWindow): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a sla window. */
export class SlaWindowValidator {
  rules: SlaWindowRule[];

  constructor(rules: SlaWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SlaWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaWindow[]): Map<string, string[]> {
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

export function defaultSlaWindowValidator(): SlaWindowValidator {
  return new SlaWindowValidator(
    [
      new SlaWindowClicksRangeRule(32, 3600),
      new SlaWindowAllowedReviewerRule(["batched", "strict", "default"]),
      new SlaWindowMaximumRangeRule(6.6, 1454.1),
      new SlaWindowRequiredCodeRule("sla window needs an entry"),
      new SlaWindowCodeLengthRule(32),
      new SlaWindowBidRangeRule(2.8, 3861.8),
    ],
  );
}
