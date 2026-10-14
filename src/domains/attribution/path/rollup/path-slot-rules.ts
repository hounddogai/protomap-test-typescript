import * as text from "../../../../kit/text.js";
import { PathSlot } from "./path-slot.js";

/** A rule a path slot must pass. Check returns its problems, or none. */
export interface PathSlotRule {
  check(item: PathSlot): string[];
}

export class PathSlotAllowedCodeRule implements PathSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class PathSlotCodePrefixRule implements PathSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathSlotNameLengthRule implements PathSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathSlotScoreRangeRule implements PathSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathSlot): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathSlotRequiredCodeRule implements PathSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path slot. */
export class PathSlotValidator {
  rules: PathSlotRule[];

  constructor(rules: PathSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PathSlot): string[] {
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

  requireValid(item: PathSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathSlot[]): Map<string, string[]> {
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

export function defaultPathSlotValidator(): PathSlotValidator {
  return new PathSlotValidator(
    [
      new PathSlotAllowedCodeRule(["batched"]),
      new PathSlotCodePrefixRule("Q"),
      new PathSlotNameLengthRule(80),
      new PathSlotScoreRangeRule(8, 2744.7),
      new PathSlotRequiredCodeRule("path slot needs an entry"),
    ],
  );
}
