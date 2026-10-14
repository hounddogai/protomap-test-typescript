import { PendingReputationAllocation } from "./pending-reputation-allocation.js";

/** A rule a pending reputation allocation must pass. Check returns its problems, or none. */
export interface PendingReputationAllocationRule {
  check(item: PendingReputationAllocation): string[];
}

export class PendingReputationAllocationExpiresAtRangeRule implements PendingReputationAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingReputationAllocation): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingReputationAllocationClicksRangeRule implements PendingReputationAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingReputationAllocation): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingReputationAllocationRequiredNameRule implements PendingReputationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReputationAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReputationAllocationNameLengthRule implements PendingReputationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReputationAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingReputationAllocationCodePrefixRule implements PendingReputationAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingReputationAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingReputationAllocationJourneyIdLengthRule implements PendingReputationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReputationAllocation): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending reputation allocation. */
export class PendingReputationAllocationValidator {
  rules: PendingReputationAllocationRule[];

  constructor(rules: PendingReputationAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PendingReputationAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingReputationAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingReputationAllocation[]): Map<string, string[]> {
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

export function defaultPendingReputationAllocationValidator(): PendingReputationAllocationValidator {
  return new PendingReputationAllocationValidator(
    [
      new PendingReputationAllocationExpiresAtRangeRule(120, 255),
      new PendingReputationAllocationClicksRangeRule(16, 86400),
      new PendingReputationAllocationRequiredNameRule("pending reputation allocation needs a value"),
      new PendingReputationAllocationNameLengthRule(80),
      new PendingReputationAllocationCodePrefixRule("X"),
      new PendingReputationAllocationJourneyIdLengthRule(1000),
    ],
  );
}
