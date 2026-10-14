import * as text from "../../../../kit/text.js";
import { DefaultApprovalWindow } from "./default-approval-window.js";

/** A rule a default approval window must pass. Check returns its problems, or none. */
export interface DefaultApprovalWindowRule {
  check(item: DefaultApprovalWindow): string[];
}

export class DefaultApprovalWindowNameLengthRule implements DefaultApprovalWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultApprovalWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultApprovalWindowEndsAtRangeRule implements DefaultApprovalWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultApprovalWindow): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultApprovalWindowRequiredNameRule implements DefaultApprovalWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultApprovalWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultApprovalWindowWeightRangeRule implements DefaultApprovalWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultApprovalWindow): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultApprovalWindowAllowedLocaleRule implements DefaultApprovalWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultApprovalWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is missing`];
    return [];
  }
}

/** Runs every rule of a default approval window. */
export class DefaultApprovalWindowValidator {
  rules: DefaultApprovalWindowRule[];

  constructor(rules: DefaultApprovalWindowRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultApprovalWindow): string[] {
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

  requireValid(item: DefaultApprovalWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultApprovalWindow[]): Map<string, string[]> {
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

export function defaultDefaultApprovalWindowValidator(): DefaultApprovalWindowValidator {
  return new DefaultApprovalWindowValidator(
    [
      new DefaultApprovalWindowNameLengthRule(3600),
      new DefaultApprovalWindowEndsAtRangeRule(86400, 86400),
      new DefaultApprovalWindowRequiredNameRule("default approval window needs an entry"),
      new DefaultApprovalWindowWeightRangeRule(3.2, 578.6),
      new DefaultApprovalWindowAllowedLocaleRule(["scheduled", "regional"]),
    ],
  );
}
