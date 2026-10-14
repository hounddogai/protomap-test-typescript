import * as text from "../../../../kit/text.js";
import { OptOutAdjustment } from "./opt-out-adjustment.js";

/** A rule a opt out adjustment must pass. Check returns its problems, or none. */
export interface OptOutAdjustmentRule {
  check(item: OptOutAdjustment): string[];
}

export class OptOutAdjustmentAllowedNameRule implements OptOutAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class OptOutAdjustmentNameLengthRule implements OptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutAdjustmentRequiredNameRule implements OptOutAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutAdjustmentPinnedGuardRule implements OptOutAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: OptOutAdjustment): string[] {
    if (item.pinned && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class OptOutAdjustmentCodeLengthRule implements OptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutAdjustmentRequiredCodeRule implements OptOutAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out adjustment. */
export class OptOutAdjustmentValidator {
  rules: OptOutAdjustmentRule[];

  constructor(rules: OptOutAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutAdjustment[]): Map<string, string[]> {
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

export function defaultOptOutAdjustmentValidator(): OptOutAdjustmentValidator {
  return new OptOutAdjustmentValidator(
    [
      new OptOutAdjustmentAllowedNameRule(["pending", "seasonal"]),
      new OptOutAdjustmentNameLengthRule(255),
      new OptOutAdjustmentRequiredNameRule("opt out adjustment needs an entry"),
      new OptOutAdjustmentPinnedGuardRule(6),
      new OptOutAdjustmentCodeLengthRule(3600),
      new OptOutAdjustmentRequiredCodeRule("opt out adjustment needs a value"),
    ],
  );
}
