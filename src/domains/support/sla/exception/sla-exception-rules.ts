import * as text from "../../../../kit/text.js";
import { SlaException } from "./sla-exception.js";

/** A rule a sla exception must pass. Check returns its problems, or none. */
export interface SlaExceptionRule {
  check(item: SlaException): string[];
}

export class SlaExceptionCapacityRangeRule implements SlaExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaException): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaExceptionRequiredCodeRule implements SlaExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaExceptionAllowedCodeRule implements SlaExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class SlaExceptionPinnedGuardRule implements SlaExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SlaException): string[] {
    if (item.pinned && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a sla exception. */
export class SlaExceptionValidator {
  rules: SlaExceptionRule[];

  constructor(rules: SlaExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: SlaException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaException[]): Map<string, string[]> {
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

export function defaultSlaExceptionValidator(): SlaExceptionValidator {
  return new SlaExceptionValidator(
    [
      new SlaExceptionCapacityRangeRule(64, 255),
      new SlaExceptionRequiredCodeRule("sla exception needs a value"),
      new SlaExceptionAllowedCodeRule(["weighted", "primary"]),
      new SlaExceptionPinnedGuardRule(255),
    ],
  );
}
