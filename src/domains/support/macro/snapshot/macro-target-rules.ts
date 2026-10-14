import * as text from "../../../../kit/text.js";
import { MacroTarget } from "./macro-target.js";

/** A rule a macro target must pass. Check returns its problems, or none. */
export interface MacroTargetRule {
  check(item: MacroTarget): string[];
}

export class MacroTargetRequiredCodeRule implements MacroTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroTargetWindowDaysRangeRule implements MacroTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroTarget): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroTargetCodeLengthRule implements MacroTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroTargetRegionLengthRule implements MacroTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroTarget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroTargetRequiredRegionRule implements MacroTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroTarget): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class MacroTargetAllowedSourceRule implements MacroTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is above maximum`];
    return [];
  }
}

/** Runs every rule of a macro target. */
export class MacroTargetValidator {
  rules: MacroTargetRule[];

  constructor(rules: MacroTargetRule[]) {
    this.rules = rules;
  }

  validate(item: MacroTarget): string[] {
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

  requireValid(item: MacroTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroTarget[]): Map<string, string[]> {
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

export function defaultMacroTargetValidator(): MacroTargetValidator {
  return new MacroTargetValidator(
    [
      new MacroTargetRequiredCodeRule("macro target needs an entry"),
      new MacroTargetWindowDaysRangeRule(80, 80),
      new MacroTargetCodeLengthRule(255),
      new MacroTargetRegionLengthRule(80),
      new MacroTargetRequiredRegionRule("macro target needs an entry"),
      new MacroTargetAllowedSourceRule(["primary", "manual", "seasonal"]),
    ],
  );
}
