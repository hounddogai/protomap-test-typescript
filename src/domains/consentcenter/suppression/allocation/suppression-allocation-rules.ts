import { SuppressionAllocation } from "./suppression-allocation.js";

/** A rule a suppression allocation must pass. Check returns its problems, or none. */
export interface SuppressionAllocationRule {
  check(item: SuppressionAllocation): string[];
}

export class SuppressionAllocationSourceLengthRule implements SuppressionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionAllocation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionAllocationRequiredVariantRule implements SuppressionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAllocation): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionAllocationRequiredSourceRule implements SuppressionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAllocation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression allocation. */
export class SuppressionAllocationValidator {
  rules: SuppressionAllocationRule[];

  constructor(rules: SuppressionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionAllocation): string[] {
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

  requireValid(item: SuppressionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionAllocation[]): Map<string, string[]> {
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

export function defaultSuppressionAllocationValidator(): SuppressionAllocationValidator {
  return new SuppressionAllocationValidator(
    [
      new SuppressionAllocationSourceLengthRule(1000),
      new SuppressionAllocationRequiredVariantRule("suppression allocation needs a value"),
      new SuppressionAllocationRequiredSourceRule("suppression allocation needs an entry"),
    ],
  );
}
