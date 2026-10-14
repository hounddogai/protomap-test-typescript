import { LegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

/** A rule a legacy warmup allocation must pass. Check returns its problems, or none. */
export interface LegacyWarmupAllocationRule {
  check(item: LegacyWarmupAllocation): string[];
}

export class LegacyWarmupAllocationRequiredNameRule implements LegacyWarmupAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWarmupAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWarmupAllocationNameLengthRule implements LegacyWarmupAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWarmupAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWarmupAllocationCodePrefixRule implements LegacyWarmupAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyWarmupAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy warmup allocation. */
export class LegacyWarmupAllocationValidator {
  rules: LegacyWarmupAllocationRule[];

  constructor(rules: LegacyWarmupAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWarmupAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWarmupAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWarmupAllocation[]): Map<string, string[]> {
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

export function defaultLegacyWarmupAllocationValidator(): LegacyWarmupAllocationValidator {
  return new LegacyWarmupAllocationValidator(
    [
      new LegacyWarmupAllocationRequiredNameRule("legacy warmup allocation needs this field"),
      new LegacyWarmupAllocationNameLengthRule(16),
      new LegacyWarmupAllocationCodePrefixRule("X"),
    ],
  );
}
