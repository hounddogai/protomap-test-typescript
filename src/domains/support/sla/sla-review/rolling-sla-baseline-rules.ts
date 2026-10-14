import * as text from "../../../../kit/text.js";
import { RollingSlaBaseline } from "./rolling-sla-baseline.js";

/** A rule a rolling sla baseline must pass. Check returns its problems, or none. */
export interface RollingSlaBaselineRule {
  check(item: RollingSlaBaseline): string[];
}

export class RollingSlaBaselineCodePrefixRule implements RollingSlaBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSlaBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSlaBaselineCapacityRangeRule implements RollingSlaBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSlaBaseline): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSlaBaselineAllowedContactEmailRule implements RollingSlaBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingSlaBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is inconsistent`];
    return [];
  }
}

export class RollingSlaBaselineRequiredTitleRule implements RollingSlaBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSlaBaselineNameLengthRule implements RollingSlaBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSlaBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSlaBaselineRequiredCodeRule implements RollingSlaBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling sla baseline. */
export class RollingSlaBaselineValidator {
  rules: RollingSlaBaselineRule[];

  constructor(rules: RollingSlaBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSlaBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingSlaBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSlaBaseline[]): Map<string, string[]> {
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

export function defaultRollingSlaBaselineValidator(): RollingSlaBaselineValidator {
  return new RollingSlaBaselineValidator(
    [
      new RollingSlaBaselineCodePrefixRule("REF"),
      new RollingSlaBaselineCapacityRangeRule(32, 80),
      new RollingSlaBaselineAllowedContactEmailRule(["strict", "capped", "tiered"]),
      new RollingSlaBaselineRequiredTitleRule("rolling sla baseline needs an entry"),
      new RollingSlaBaselineNameLengthRule(16),
      new RollingSlaBaselineRequiredCodeRule("rolling sla baseline needs a value"),
    ],
  );
}
