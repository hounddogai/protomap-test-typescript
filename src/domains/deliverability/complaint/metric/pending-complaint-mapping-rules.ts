import { PendingComplaintMapping } from "./pending-complaint-mapping.js";

/** A rule a pending complaint mapping must pass. Check returns its problems, or none. */
export interface PendingComplaintMappingRule {
  check(item: PendingComplaintMapping): string[];
}

export class PendingComplaintMappingCodeLengthRule implements PendingComplaintMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingComplaintMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingComplaintMappingCodePrefixRule implements PendingComplaintMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingComplaintMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingComplaintMappingOpenRateRangeRule implements PendingComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingComplaintMapping): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending complaint mapping. */
export class PendingComplaintMappingValidator {
  rules: PendingComplaintMappingRule[];

  constructor(rules: PendingComplaintMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PendingComplaintMapping): string[] {
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

  requireValid(item: PendingComplaintMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingComplaintMapping[]): Map<string, string[]> {
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

export function defaultPendingComplaintMappingValidator(): PendingComplaintMappingValidator {
  return new PendingComplaintMappingValidator(
    [
      new PendingComplaintMappingCodeLengthRule(120),
      new PendingComplaintMappingCodePrefixRule("REF"),
      new PendingComplaintMappingOpenRateRangeRule(9.3, 3029.2),
    ],
  );
}
