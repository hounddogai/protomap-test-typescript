import * as text from "../../../../kit/text.js";
import { RollingMacroCycle } from "./rolling-macro-cycle.js";

/** A rule a rolling macro cycle must pass. Check returns its problems, or none. */
export interface RollingMacroCycleRule {
  check(item: RollingMacroCycle): string[];
}

export class RollingMacroCycleMinimumRangeRule implements RollingMacroCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMacroCycle): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingMacroCycleRequiredCodeRule implements RollingMacroCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingMacroCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingMacroCycleRequiredLabelRule implements RollingMacroCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingMacroCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingMacroCycleVariantLengthRule implements RollingMacroCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingMacroCycle): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingMacroCycleAllowedOwnerIdRule implements RollingMacroCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingMacroCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is out of range`];
    return [];
  }
}

export class RollingMacroCycleLabelLengthRule implements RollingMacroCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingMacroCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling macro cycle. */
export class RollingMacroCycleValidator {
  rules: RollingMacroCycleRule[];

  constructor(rules: RollingMacroCycleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingMacroCycle): string[] {
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

  requireValid(item: RollingMacroCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingMacroCycle[]): Map<string, string[]> {
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

export function defaultRollingMacroCycleValidator(): RollingMacroCycleValidator {
  return new RollingMacroCycleValidator(
    [
      new RollingMacroCycleMinimumRangeRule(5.2, 2541),
      new RollingMacroCycleRequiredCodeRule("rolling macro cycle needs this field"),
      new RollingMacroCycleRequiredLabelRule("rolling macro cycle needs this field"),
      new RollingMacroCycleVariantLengthRule(80),
      new RollingMacroCycleAllowedOwnerIdRule(["tiered", "scheduled", "rolling"]),
      new RollingMacroCycleLabelLengthRule(86400),
    ],
  );
}
