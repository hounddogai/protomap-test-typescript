import * as text from "../../../../kit/text.js";
import { FallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

/** A rule a fallback macro snapshot must pass. Check returns its problems, or none. */
export interface FallbackMacroSnapshotRule {
  check(item: FallbackMacroSnapshot): string[];
}

export class FallbackMacroSnapshotRequiredNameRule implements FallbackMacroSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMacroSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackMacroSnapshotDiscountRangeRule implements FallbackMacroSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackMacroSnapshot): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackMacroSnapshotAllowedNameRule implements FallbackMacroSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackMacroSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class FallbackMacroSnapshotRequiredCodeRule implements FallbackMacroSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMacroSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackMacroSnapshotNameLengthRule implements FallbackMacroSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackMacroSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback macro snapshot. */
export class FallbackMacroSnapshotValidator {
  rules: FallbackMacroSnapshotRule[];

  constructor(rules: FallbackMacroSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackMacroSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackMacroSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackMacroSnapshot[]): Map<string, string[]> {
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

export function defaultFallbackMacroSnapshotValidator(): FallbackMacroSnapshotValidator {
  return new FallbackMacroSnapshotValidator(
    [
      new FallbackMacroSnapshotRequiredNameRule("fallback macro snapshot needs a value"),
      new FallbackMacroSnapshotDiscountRangeRule(1.7, 2664.2),
      new FallbackMacroSnapshotAllowedNameRule([]),
      new FallbackMacroSnapshotRequiredCodeRule("fallback macro snapshot needs this field"),
      new FallbackMacroSnapshotNameLengthRule(1000),
    ],
  );
}
