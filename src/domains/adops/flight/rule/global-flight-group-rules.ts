import * as text from "../../../../kit/text.js";
import { GlobalFlightGroup } from "./global-flight-group.js";

/** A rule a global flight group must pass. Check returns its problems, or none. */
export interface GlobalFlightGroupRule {
  check(item: GlobalFlightGroup): string[];
}

export class GlobalFlightGroupFrequencyCapRangeRule implements GlobalFlightGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFlightGroup): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFlightGroupLabelLengthRule implements GlobalFlightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightGroupRequiredLabelRule implements GlobalFlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFlightGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFlightGroupAllowedCodeRule implements GlobalFlightGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalFlightGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a global flight group. */
export class GlobalFlightGroupValidator {
  rules: GlobalFlightGroupRule[];

  constructor(rules: GlobalFlightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFlightGroup): string[] {
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

  requireValid(item: GlobalFlightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFlightGroup[]): Map<string, string[]> {
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

export function defaultGlobalFlightGroupValidator(): GlobalFlightGroupValidator {
  return new GlobalFlightGroupValidator(
    [
      new GlobalFlightGroupFrequencyCapRangeRule(120, 255),
      new GlobalFlightGroupLabelLengthRule(64),
      new GlobalFlightGroupRequiredLabelRule("global flight group needs an entry"),
      new GlobalFlightGroupAllowedCodeRule([]),
    ],
  );
}
