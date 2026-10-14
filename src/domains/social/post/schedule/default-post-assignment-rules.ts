import * as text from "../../../../kit/text.js";
import { DefaultPostAssignment } from "./default-post-assignment.js";

/** A rule a default post assignment must pass. Check returns its problems, or none. */
export interface DefaultPostAssignmentRule {
  check(item: DefaultPostAssignment): string[];
}

export class DefaultPostAssignmentCodeLengthRule implements DefaultPostAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPostAssignmentMarginRangeRule implements DefaultPostAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPostAssignment): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPostAssignmentRequiredCodeRule implements DefaultPostAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPostAssignmentCodePrefixRule implements DefaultPostAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPostAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPostAssignmentAllowedCodeRule implements DefaultPostAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPostAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class DefaultPostAssignmentRequiredLabelRule implements DefaultPostAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default post assignment. */
export class DefaultPostAssignmentValidatorExtra {
  rules: DefaultPostAssignmentRule[];

  constructor(rules: DefaultPostAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPostAssignment): string[] {
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

  requireValid(item: DefaultPostAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPostAssignment[]): Map<string, string[]> {
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

export function defaultDefaultPostAssignmentValidator(): DefaultPostAssignmentValidatorExtra {
  return new DefaultPostAssignmentValidatorExtra(
    [
      new DefaultPostAssignmentCodeLengthRule(3600),
      new DefaultPostAssignmentMarginRangeRule(3.7, 2893.5),
      new DefaultPostAssignmentRequiredCodeRule("default post assignment needs a value"),
      new DefaultPostAssignmentCodePrefixRule("OPS"),
      new DefaultPostAssignmentAllowedCodeRule(["default"]),
      new DefaultPostAssignmentRequiredLabelRule("default post assignment needs a value"),
    ],
  );
}
