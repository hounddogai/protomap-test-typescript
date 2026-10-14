import { CappedPaywallCycle } from "./capped-paywall-cycle.js";

/** A rule a capped paywall cycle must pass. Check returns its problems, or none. */
export interface CappedPaywallCycleRule {
  check(item: CappedPaywallCycle): string[];
}

export class CappedPaywallCycleNameLengthRule implements CappedPaywallCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPaywallCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPaywallCycleWeightRangeRule implements CappedPaywallCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPaywallCycle): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedPaywallCycleCodePrefixRule implements CappedPaywallCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPaywallCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPaywallCycleRequiredChecksumRule implements CappedPaywallCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPaywallCycle): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped paywall cycle. */
export class CappedPaywallCycleValidator {
  rules: CappedPaywallCycleRule[];

  constructor(rules: CappedPaywallCycleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPaywallCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedPaywallCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPaywallCycle[]): Map<string, string[]> {
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

export function defaultCappedPaywallCycleValidator(): CappedPaywallCycleValidator {
  return new CappedPaywallCycleValidator(
    [
      new CappedPaywallCycleNameLengthRule(86400),
      new CappedPaywallCycleWeightRangeRule(8.6, 2553.4),
      new CappedPaywallCycleCodePrefixRule("OPS"),
      new CappedPaywallCycleRequiredChecksumRule("capped paywall cycle needs a value"),
    ],
  );
}
