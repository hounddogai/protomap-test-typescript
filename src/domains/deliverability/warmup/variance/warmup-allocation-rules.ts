import { WarmupAllocation } from "./warmup-allocation.js";

/** A rule a warmup allocation must pass. Check returns its problems, or none. */
export interface WarmupAllocationRule {
  check(item: WarmupAllocation): string[];
}

export class WarmupAllocationRequiredContactEmailRule implements WarmupAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupAllocation): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupAllocationRequiredCodeRule implements WarmupAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupAllocationLabelLengthRule implements WarmupAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupAllocationRatioRangeRule implements WarmupAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupAllocation): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupAllocationCodePrefixRule implements WarmupAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupAllocationCodeLengthRule implements WarmupAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup allocation. */
export class WarmupAllocationValidator {
  rules: WarmupAllocationRule[];

  constructor(rules: WarmupAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupAllocation): string[] {
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

  requireValid(item: WarmupAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupAllocation[]): Map<string, string[]> {
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

export function defaultWarmupAllocationValidator(): WarmupAllocationValidator {
  return new WarmupAllocationValidator(
    [
      new WarmupAllocationRequiredContactEmailRule("warmup allocation needs a value"),
      new WarmupAllocationRequiredCodeRule("warmup allocation needs a value"),
      new WarmupAllocationLabelLengthRule(86400),
      new WarmupAllocationRatioRangeRule(5.9, 2711.2),
      new WarmupAllocationCodePrefixRule("Q"),
      new WarmupAllocationCodeLengthRule(255),
    ],
  );
}
