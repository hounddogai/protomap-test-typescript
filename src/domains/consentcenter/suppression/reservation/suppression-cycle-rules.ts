import * as text from "../../../../kit/text.js";
import { SuppressionCycle } from "./suppression-cycle.js";

/** A rule a suppression cycle must pass. Check returns its problems, or none. */
export interface SuppressionCycleRule {
  check(item: SuppressionCycle): string[];
}

export class SuppressionCycleCodeLengthRule implements SuppressionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionCycleRateRangeRule implements SuppressionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionCycle): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionCycleRequiredNameRule implements SuppressionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionCycleNameLengthRule implements SuppressionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionCycleAllowedLocaleRule implements SuppressionCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a suppression cycle. */
export class SuppressionCycleValidator {
  rules: SuppressionCycleRule[];

  constructor(rules: SuppressionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionCycle): string[] {
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

  requireValid(item: SuppressionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionCycle[]): Map<string, string[]> {
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

export function defaultSuppressionCycleValidator(): SuppressionCycleValidator {
  return new SuppressionCycleValidator(
    [
      new SuppressionCycleCodeLengthRule(86400),
      new SuppressionCycleRateRangeRule(1.7, 4460.7),
      new SuppressionCycleRequiredNameRule("suppression cycle needs a value"),
      new SuppressionCycleNameLengthRule(120),
      new SuppressionCycleAllowedLocaleRule(["regional", "batched"]),
    ],
  );
}
