import * as text from "../../../../kit/text.js";
import { CappedNudgeException } from "./capped-nudge-exception.js";

/** A rule a capped nudge exception must pass. Check returns its problems, or none. */
export interface CappedNudgeExceptionRule {
  check(item: CappedNudgeException): string[];
}

export class CappedNudgeExceptionOpenRateRangeRule implements CappedNudgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedNudgeException): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedNudgeExceptionPriorityRangeRule implements CappedNudgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedNudgeException): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedNudgeExceptionRequiredCodeRule implements CappedNudgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedNudgeException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedNudgeExceptionCodeLengthRule implements CappedNudgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedNudgeExceptionAllowedCodeRule implements CappedNudgeExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedNudgeException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class CappedNudgeExceptionClicksRangeRule implements CappedNudgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedNudgeException): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped nudge exception. */
export class CappedNudgeExceptionValidator {
  rules: CappedNudgeExceptionRule[];

  constructor(rules: CappedNudgeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: CappedNudgeException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedNudgeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedNudgeException[]): Map<string, string[]> {
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

export function defaultCappedNudgeExceptionValidator(): CappedNudgeExceptionValidator {
  return new CappedNudgeExceptionValidator(
    [
      new CappedNudgeExceptionOpenRateRangeRule(1, 3471.3),
      new CappedNudgeExceptionPriorityRangeRule(64, 80),
      new CappedNudgeExceptionRequiredCodeRule("capped nudge exception needs an entry"),
      new CappedNudgeExceptionCodeLengthRule(80),
      new CappedNudgeExceptionAllowedCodeRule(["pending"]),
      new CappedNudgeExceptionClicksRangeRule(120, 3600),
    ],
  );
}
