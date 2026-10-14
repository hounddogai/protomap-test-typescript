import * as text from "../../../../kit/text.js";
import { GlobalEscalationAllocation } from "./global-escalation-allocation.js";

/** A rule a global escalation allocation must pass. Check returns its problems, or none. */
export interface GlobalEscalationAllocationRule {
  check(item: GlobalEscalationAllocation): string[];
}

export class GlobalEscalationAllocationLabelLengthRule implements GlobalEscalationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEscalationAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEscalationAllocationQuantityRangeRule implements GlobalEscalationAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEscalationAllocation): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalEscalationAllocationBidRangeRule implements GlobalEscalationAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEscalationAllocation): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalEscalationAllocationCodeLengthRule implements GlobalEscalationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEscalationAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEscalationAllocationRequiredTimezoneRule implements GlobalEscalationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEscalationAllocation): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalEscalationAllocationAllowedTimezoneRule implements GlobalEscalationAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalEscalationAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is above maximum`];
    return [];
  }
}

/** Runs every rule of a global escalation allocation. */
export class GlobalEscalationAllocationValidator {
  rules: GlobalEscalationAllocationRule[];

  constructor(rules: GlobalEscalationAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalEscalationAllocation): string[] {
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

  requireValid(item: GlobalEscalationAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalEscalationAllocation[]): Map<string, string[]> {
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

export function defaultGlobalEscalationAllocationValidator(): GlobalEscalationAllocationValidator {
  return new GlobalEscalationAllocationValidator(
    [
      new GlobalEscalationAllocationLabelLengthRule(32),
      new GlobalEscalationAllocationQuantityRangeRule(80, 1000),
      new GlobalEscalationAllocationBidRangeRule(5.3, 321.6),
      new GlobalEscalationAllocationCodeLengthRule(64),
      new GlobalEscalationAllocationRequiredTimezoneRule("global escalation allocation needs a value"),
      new GlobalEscalationAllocationAllowedTimezoneRule(["batched", "default", "global"]),
    ],
  );
}
