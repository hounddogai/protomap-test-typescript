import { SlaAdjustment } from "./sla-adjustment.js";

/** A rule a sla adjustment must pass. Check returns its problems, or none. */
export interface SlaAdjustmentRule {
  check(item: SlaAdjustment): string[];
}

export class SlaAdjustmentChecksumLengthRule implements SlaAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAdjustment): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaAdjustmentAmountRangeRule implements SlaAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaAdjustment): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaAdjustmentCodePrefixRule implements SlaAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaAdjustmentRegionLengthRule implements SlaAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAdjustment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaAdjustmentTitleLengthRule implements SlaAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla adjustment. */
export class SlaAdjustmentValidator {
  rules: SlaAdjustmentRule[];

  constructor(rules: SlaAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: SlaAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaAdjustment[]): Map<string, string[]> {
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

export function defaultSlaAdjustmentValidator(): SlaAdjustmentValidator {
  return new SlaAdjustmentValidator(
    [
      new SlaAdjustmentChecksumLengthRule(32),
      new SlaAdjustmentAmountRangeRule(5.2, 2687.3),
      new SlaAdjustmentCodePrefixRule("X"),
      new SlaAdjustmentRegionLengthRule(80),
      new SlaAdjustmentTitleLengthRule(120),
    ],
  );
}
