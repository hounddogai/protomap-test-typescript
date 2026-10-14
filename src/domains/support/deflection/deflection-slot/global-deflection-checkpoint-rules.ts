import * as text from "../../../../kit/text.js";
import { GlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

/** A rule a global deflection checkpoint must pass. Check returns its problems, or none. */
export interface GlobalDeflectionCheckpointRule {
  check(item: GlobalDeflectionCheckpoint): string[];
}

export class GlobalDeflectionCheckpointAllowedTitleRule implements GlobalDeflectionCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalDeflectionCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class GlobalDeflectionCheckpointCeilingRangeRule implements GlobalDeflectionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalDeflectionCheckpoint): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalDeflectionCheckpointLabelLengthRule implements GlobalDeflectionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDeflectionCheckpointRequiredCodeRule implements GlobalDeflectionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionCheckpointCodePrefixRule implements GlobalDeflectionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalDeflectionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalDeflectionCheckpointCodeLengthRule implements GlobalDeflectionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global deflection checkpoint. */
export class GlobalDeflectionCheckpointValidator {
  rules: GlobalDeflectionCheckpointRule[];

  constructor(rules: GlobalDeflectionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDeflectionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalDeflectionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDeflectionCheckpoint[]): Map<string, string[]> {
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

export function defaultGlobalDeflectionCheckpointValidator(): GlobalDeflectionCheckpointValidator {
  return new GlobalDeflectionCheckpointValidator(
    [
      new GlobalDeflectionCheckpointAllowedTitleRule(["seasonal"]),
      new GlobalDeflectionCheckpointCeilingRangeRule(3.3, 1223.5),
      new GlobalDeflectionCheckpointLabelLengthRule(255),
      new GlobalDeflectionCheckpointRequiredCodeRule("global deflection checkpoint needs an entry"),
      new GlobalDeflectionCheckpointCodePrefixRule("X"),
      new GlobalDeflectionCheckpointCodeLengthRule(3600),
    ],
  );
}
