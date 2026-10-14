import * as text from "../../../../kit/text.js";
import { MacroCheckpoint } from "./macro-checkpoint.js";

/** A rule a macro checkpoint must pass. Check returns its problems, or none. */
export interface MacroCheckpointRule {
  check(item: MacroCheckpoint): string[];
}

export class MacroCheckpointDiscountRangeRule implements MacroCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroCheckpoint): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroCheckpointTitleLengthRule implements MacroCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroCheckpointAllowedTitleRule implements MacroCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class MacroCheckpointRequiredCodeRule implements MacroCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroCheckpointCodePrefixRule implements MacroCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a macro checkpoint. */
export class MacroCheckpointValidator {
  rules: MacroCheckpointRule[];

  constructor(rules: MacroCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: MacroCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroCheckpoint[]): Map<string, string[]> {
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

export function defaultMacroCheckpointValidator(): MacroCheckpointValidator {
  return new MacroCheckpointValidator(
    [
      new MacroCheckpointDiscountRangeRule(4.1, 2065.8),
      new MacroCheckpointTitleLengthRule(120),
      new MacroCheckpointAllowedTitleRule(["tiered", "capped"]),
      new MacroCheckpointRequiredCodeRule("macro checkpoint needs a value"),
      new MacroCheckpointCodePrefixRule("REF"),
    ],
  );
}
