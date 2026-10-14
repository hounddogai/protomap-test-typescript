import { PaywallCycle } from "./paywall-cycle.js";

/** A rule a paywall cycle must pass. Check returns its problems, or none. */
export interface PaywallCycleRule {
  check(item: PaywallCycle): string[];
}

export class PaywallCycleRequiredCodeRule implements PaywallCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallCycleCodePrefixRule implements PaywallCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallCycleCodeLengthRule implements PaywallCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallCycleRequiredLabelRule implements PaywallCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallCycleBidRangeRule implements PaywallCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallCycle): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallCycleRequiredNotesRule implements PaywallCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallCycle): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall cycle. */
export class PaywallCycleValidator {
  rules: PaywallCycleRule[];

  constructor(rules: PaywallCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallCycle[]): Map<string, string[]> {
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

export function defaultPaywallCycleValidator(): PaywallCycleValidator {
  return new PaywallCycleValidator(
    [
      new PaywallCycleRequiredCodeRule("paywall cycle needs this field"),
      new PaywallCycleCodePrefixRule("X"),
      new PaywallCycleCodeLengthRule(80),
      new PaywallCycleRequiredLabelRule("paywall cycle needs a value"),
      new PaywallCycleBidRangeRule(0.5, 4159.6),
      new PaywallCycleRequiredNotesRule("paywall cycle needs this field"),
    ],
  );
}
