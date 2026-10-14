import * as text from "../../../../kit/text.js";
import { CappedNudgeMapping } from "./capped-nudge-mapping.js";

/** A rule a capped nudge mapping must pass. Check returns its problems, or none. */
export interface CappedNudgeMappingRule {
  check(item: CappedNudgeMapping): string[];
}

export class CappedNudgeMappingLabelLengthRule implements CappedNudgeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedNudgeMappingCodeLengthRule implements CappedNudgeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedNudgeMappingEndsAtRangeRule implements CappedNudgeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedNudgeMapping): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedNudgeMappingRequiredLabelRule implements CappedNudgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedNudgeMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedNudgeMappingAllowedLabelRule implements CappedNudgeMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedNudgeMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class CappedNudgeMappingRequiredCodeRule implements CappedNudgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedNudgeMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped nudge mapping. */
export class CappedNudgeMappingValidator {
  rules: CappedNudgeMappingRule[];

  constructor(rules: CappedNudgeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: CappedNudgeMapping): string[] {
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

  requireValid(item: CappedNudgeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedNudgeMapping[]): Map<string, string[]> {
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

export function defaultCappedNudgeMappingValidator(): CappedNudgeMappingValidator {
  return new CappedNudgeMappingValidator(
    [
      new CappedNudgeMappingLabelLengthRule(86400),
      new CappedNudgeMappingCodeLengthRule(3600),
      new CappedNudgeMappingEndsAtRangeRule(3600, 86400),
      new CappedNudgeMappingRequiredLabelRule("capped nudge mapping needs a value"),
      new CappedNudgeMappingAllowedLabelRule(["manual", "fallback"]),
      new CappedNudgeMappingRequiredCodeRule("capped nudge mapping needs a value"),
    ],
  );
}
