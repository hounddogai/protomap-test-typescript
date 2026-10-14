import * as text from "../../../../kit/text.js";
import { RollingSlaTier } from "./rolling-sla-tier.js";

/** A rule a rolling sla tier must pass. Check returns its problems, or none. */
export interface RollingSlaTierRule {
  check(item: RollingSlaTier): string[];
}

export class RollingSlaTierLabelLengthRule implements RollingSlaTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSlaTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSlaTierAttemptsRangeRule implements RollingSlaTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSlaTier): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSlaTierAllowedCodeRule implements RollingSlaTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingSlaTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class RollingSlaTierRequiredLabelRule implements RollingSlaTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSlaTierRequiredCodeRule implements RollingSlaTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSlaTierCodeLengthRule implements RollingSlaTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSlaTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling sla tier. */
export class RollingSlaTierValidator {
  rules: RollingSlaTierRule[];

  constructor(rules: RollingSlaTierRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSlaTier): string[] {
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

  requireValid(item: RollingSlaTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSlaTier[]): Map<string, string[]> {
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

export function defaultRollingSlaTierValidator(): RollingSlaTierValidator {
  return new RollingSlaTierValidator(
    [
      new RollingSlaTierLabelLengthRule(1000),
      new RollingSlaTierAttemptsRangeRule(64, 3600),
      new RollingSlaTierAllowedCodeRule(["scheduled", "manual"]),
      new RollingSlaTierRequiredLabelRule("rolling sla tier needs this field"),
      new RollingSlaTierRequiredCodeRule("rolling sla tier needs a value"),
      new RollingSlaTierCodeLengthRule(1000),
    ],
  );
}
