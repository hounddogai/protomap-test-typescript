import * as text from "../../../../kit/text.js";
import { SlaBatch } from "./sla-batch.js";

/** A rule a sla batch must pass. Check returns its problems, or none. */
export interface SlaBatchRule {
  check(item: SlaBatch): string[];
}

export class SlaBatchCodePrefixRule implements SlaBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaBatchThresholdRangeRule implements SlaBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaBatch): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaBatchNameLengthRule implements SlaBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaBatchAllowedCodeRule implements SlaBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class SlaBatchCodeLengthRule implements SlaBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaBatchRequiredCodeRule implements SlaBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sla batch. */
export class SlaBatchValidator {
  rules: SlaBatchRule[];

  constructor(rules: SlaBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SlaBatch): string[] {
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

  requireValid(item: SlaBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaBatch[]): Map<string, string[]> {
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

export function defaultSlaBatchValidator(): SlaBatchValidator {
  return new SlaBatchValidator(
    [
      new SlaBatchCodePrefixRule("REF"),
      new SlaBatchThresholdRangeRule(6.8, 1801.8),
      new SlaBatchNameLengthRule(32),
      new SlaBatchAllowedCodeRule(["pending", "manual", "primary"]),
      new SlaBatchCodeLengthRule(80),
      new SlaBatchRequiredCodeRule("sla batch needs an entry"),
    ],
  );
}
