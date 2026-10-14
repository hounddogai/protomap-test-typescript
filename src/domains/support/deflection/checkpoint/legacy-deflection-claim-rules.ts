import * as text from "../../../../kit/text.js";
import { LegacyDeflectionClaim } from "./legacy-deflection-claim.js";

/** A rule a legacy deflection claim must pass. Check returns its problems, or none. */
export interface LegacyDeflectionClaimRule {
  check(item: LegacyDeflectionClaim): string[];
}

export class LegacyDeflectionClaimAllowedLabelRule implements LegacyDeflectionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyDeflectionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class LegacyDeflectionClaimCodeLengthRule implements LegacyDeflectionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDeflectionClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDeflectionClaimRequiredCodeRule implements LegacyDeflectionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDeflectionClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDeflectionClaimRequiredNotesRule implements LegacyDeflectionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDeflectionClaim): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDeflectionClaimQuantityRangeRule implements LegacyDeflectionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDeflectionClaim): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy deflection claim. */
export class LegacyDeflectionClaimValidator {
  rules: LegacyDeflectionClaimRule[];

  constructor(rules: LegacyDeflectionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDeflectionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyDeflectionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDeflectionClaim[]): Map<string, string[]> {
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

export function defaultLegacyDeflectionClaimValidator(): LegacyDeflectionClaimValidator {
  return new LegacyDeflectionClaimValidator(
    [
      new LegacyDeflectionClaimAllowedLabelRule(["fallback"]),
      new LegacyDeflectionClaimCodeLengthRule(86400),
      new LegacyDeflectionClaimRequiredCodeRule("legacy deflection claim needs this field"),
      new LegacyDeflectionClaimRequiredNotesRule("legacy deflection claim needs a value"),
      new LegacyDeflectionClaimQuantityRangeRule(80, 120),
    ],
  );
}
