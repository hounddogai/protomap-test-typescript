import { PrimaryPaywallCycle } from "./primary-paywall-cycle.js";

/** A rule a primary paywall cycle must pass. Check returns its problems, or none. */
export interface PrimaryPaywallCycleRule {
  check(item: PrimaryPaywallCycle): string[];
}

export class PrimaryPaywallCycleRequiredContactEmailRule implements PrimaryPaywallCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPaywallCycle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPaywallCycleRequiredChecksumRule implements PrimaryPaywallCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPaywallCycle): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPaywallCycleContactEmailLengthRule implements PrimaryPaywallCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPaywallCycle): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPaywallCycleRequiredCodeRule implements PrimaryPaywallCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPaywallCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPaywallCycleCodePrefixRule implements PrimaryPaywallCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryPaywallCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryPaywallCycleChecksumLengthRule implements PrimaryPaywallCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPaywallCycle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary paywall cycle. */
export class PrimaryPaywallCycleValidator {
  rules: PrimaryPaywallCycleRule[];

  constructor(rules: PrimaryPaywallCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPaywallCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPaywallCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPaywallCycle[]): Map<string, string[]> {
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

export function defaultPrimaryPaywallCycleValidator(): PrimaryPaywallCycleValidator {
  return new PrimaryPaywallCycleValidator(
    [
      new PrimaryPaywallCycleRequiredContactEmailRule("primary paywall cycle needs a value"),
      new PrimaryPaywallCycleRequiredChecksumRule("primary paywall cycle needs a value"),
      new PrimaryPaywallCycleContactEmailLengthRule(16),
      new PrimaryPaywallCycleRequiredCodeRule("primary paywall cycle needs this field"),
      new PrimaryPaywallCycleCodePrefixRule("REF"),
      new PrimaryPaywallCycleChecksumLengthRule(3600),
    ],
  );
}
