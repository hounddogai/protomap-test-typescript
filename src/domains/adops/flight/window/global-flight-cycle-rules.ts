import * as text from "../../../../kit/text.js";
import { GlobalFlightCycle } from "./global-flight-cycle.js";

/** A rule a global flight cycle must pass. Check returns its problems, or none. */
export interface GlobalFlightCycleRule {
  check(item: GlobalFlightCycle): string[];
}

export class GlobalFlightCycleAllowedCodeRule implements GlobalFlightCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalFlightCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class GlobalFlightCycleCodeLengthRule implements GlobalFlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightCycleRequiredNotesRule implements GlobalFlightCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFlightCycle): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFlightCycleBatchSizeRangeRule implements GlobalFlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFlightCycle): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global flight cycle. */
export class GlobalFlightCycleValidator {
  rules: GlobalFlightCycleRule[];

  constructor(rules: GlobalFlightCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFlightCycle): string[] {
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

  requireValid(item: GlobalFlightCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFlightCycle[]): Map<string, string[]> {
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

export function defaultGlobalFlightCycleValidator(): GlobalFlightCycleValidator {
  return new GlobalFlightCycleValidator(
    [
      new GlobalFlightCycleAllowedCodeRule(["global", "tiered"]),
      new GlobalFlightCycleCodeLengthRule(1000),
      new GlobalFlightCycleRequiredNotesRule("global flight cycle needs this field"),
      new GlobalFlightCycleBatchSizeRangeRule(80, 80),
    ],
  );
}
