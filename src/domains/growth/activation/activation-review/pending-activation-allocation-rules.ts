import { PendingActivationAllocation } from "./pending-activation-allocation.js";

/** A rule a pending activation allocation must pass. Check returns its problems, or none. */
export interface PendingActivationAllocationRule {
  check(item: PendingActivationAllocation): string[];
}

export class PendingActivationAllocationChannelLengthRule implements PendingActivationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingActivationAllocation): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingActivationAllocationRequiredUtmSourceRule implements PendingActivationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingActivationAllocation): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PendingActivationAllocationPriorityRangeRule implements PendingActivationAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingActivationAllocation): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingActivationAllocationCodeLengthRule implements PendingActivationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingActivationAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingActivationAllocationTitleLengthRule implements PendingActivationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingActivationAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingActivationAllocationCodePrefixRule implements PendingActivationAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingActivationAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending activation allocation. */
export class PendingActivationAllocationValidator {
  rules: PendingActivationAllocationRule[];

  constructor(rules: PendingActivationAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PendingActivationAllocation): string[] {
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

  requireValid(item: PendingActivationAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingActivationAllocation[]): Map<string, string[]> {
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

export function defaultPendingActivationAllocationValidator(): PendingActivationAllocationValidator {
  return new PendingActivationAllocationValidator(
    [
      new PendingActivationAllocationChannelLengthRule(32),
      new PendingActivationAllocationRequiredUtmSourceRule("pending activation allocation needs this field"),
      new PendingActivationAllocationPriorityRangeRule(32, 1000),
      new PendingActivationAllocationCodeLengthRule(255),
      new PendingActivationAllocationTitleLengthRule(16),
      new PendingActivationAllocationCodePrefixRule("OPS"),
    ],
  );
}
