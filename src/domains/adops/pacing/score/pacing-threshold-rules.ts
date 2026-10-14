import * as text from "../../../../kit/text.js";
import { PacingThreshold } from "./pacing-threshold.js";

/** A rule a pacing threshold must pass. Check returns its problems, or none. */
export interface PacingThresholdRule {
  check(item: PacingThreshold): string[];
}

export class PacingThresholdRequiredTitleRule implements PacingThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PacingThresholdAllowedCodeRule implements PacingThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class PacingThresholdRequiredNameRule implements PacingThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PacingThresholdPhoneLengthRule implements PacingThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingThreshold): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing threshold. */
export class PacingThresholdValidator {
  rules: PacingThresholdRule[];

  constructor(rules: PacingThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PacingThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingThreshold[]): Map<string, string[]> {
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

export function defaultPacingThresholdValidator(): PacingThresholdValidator {
  return new PacingThresholdValidator(
    [
      new PacingThresholdRequiredTitleRule("pacing threshold needs this field"),
      new PacingThresholdAllowedCodeRule([]),
      new PacingThresholdRequiredNameRule("pacing threshold needs an entry"),
      new PacingThresholdPhoneLengthRule(120),
    ],
  );
}
