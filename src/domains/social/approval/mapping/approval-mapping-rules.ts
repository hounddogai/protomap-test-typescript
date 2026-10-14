import { ApprovalMapping } from "./approval-mapping.js";

/** A rule a approval mapping must pass. Check returns its problems, or none. */
export interface ApprovalMappingRule {
  check(item: ApprovalMapping): string[];
}

export class ApprovalMappingRequiredUtmSourceRule implements ApprovalMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalMapping): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalMappingCreatedAtRangeRule implements ApprovalMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalMapping): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalMappingAmountRangeRule implements ApprovalMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalMapping): string[] {
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

export class ApprovalMappingCodePrefixRule implements ApprovalMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalMappingUtmSourceLengthRule implements ApprovalMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalMapping): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalMappingRequiredCodeRule implements ApprovalMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval mapping. */
export class ApprovalMappingValidator {
  rules: ApprovalMappingRule[];

  constructor(rules: ApprovalMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalMapping): string[] {
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

  requireValid(item: ApprovalMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalMapping[]): Map<string, string[]> {
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

export function defaultApprovalMappingValidator(): ApprovalMappingValidator {
  return new ApprovalMappingValidator(
    [
      new ApprovalMappingRequiredUtmSourceRule("approval mapping needs an entry"),
      new ApprovalMappingCreatedAtRangeRule(64, 1000),
      new ApprovalMappingAmountRangeRule(2.8, 2511.4),
      new ApprovalMappingCodePrefixRule("REF"),
      new ApprovalMappingUtmSourceLengthRule(80),
      new ApprovalMappingRequiredCodeRule("approval mapping needs a value"),
    ],
  );
}
