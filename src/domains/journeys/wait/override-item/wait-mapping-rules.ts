import * as text from "../../../../kit/text.js";
import { WaitMapping } from "./wait-mapping.js";

/** A rule a wait mapping must pass. Check returns its problems, or none. */
export interface WaitMappingRule {
  check(item: WaitMapping): string[];
}

export class WaitMappingAllowedCodeRule implements WaitMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class WaitMappingMarginRangeRule implements WaitMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitMapping): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitMappingCodePrefixRule implements WaitMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitMappingRequiredCodeRule implements WaitMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitMappingPriorityRangeRule implements WaitMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitMapping): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitMappingNameLengthRule implements WaitMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait mapping. */
export class WaitMappingValidator {
  rules: WaitMappingRule[];

  constructor(rules: WaitMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WaitMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitMapping[]): Map<string, string[]> {
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

export function defaultWaitMappingValidator(): WaitMappingValidator {
  return new WaitMappingValidator(
    [
      new WaitMappingAllowedCodeRule(["adaptive"]),
      new WaitMappingMarginRangeRule(3.8, 4471),
      new WaitMappingCodePrefixRule("Q"),
      new WaitMappingRequiredCodeRule("wait mapping needs this field"),
      new WaitMappingPriorityRangeRule(32, 32),
      new WaitMappingNameLengthRule(64),
    ],
  );
}
