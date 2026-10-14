import * as text from "../../../../kit/text.js";
import { ManualRetentionMapping } from "./manual-retention-mapping.js";

/** A rule a manual retention mapping must pass. Check returns its problems, or none. */
export interface ManualRetentionMappingRule {
  check(item: ManualRetentionMapping): string[];
}

export class ManualRetentionMappingTitleLengthRule implements ManualRetentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionMappingCodeLengthRule implements ManualRetentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionMappingAllowedCodeRule implements ManualRetentionMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualRetentionMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class ManualRetentionMappingSourceLengthRule implements ManualRetentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionMapping): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionMappingCodePrefixRule implements ManualRetentionMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualRetentionMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual retention mapping. */
export class ManualRetentionMappingValidator {
  rules: ManualRetentionMappingRule[];

  constructor(rules: ManualRetentionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRetentionMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRetentionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRetentionMapping[]): Map<string, string[]> {
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

export function defaultManualRetentionMappingValidator(): ManualRetentionMappingValidator {
  return new ManualRetentionMappingValidator(
    [
      new ManualRetentionMappingTitleLengthRule(32),
      new ManualRetentionMappingCodeLengthRule(32),
      new ManualRetentionMappingAllowedCodeRule(["manual", "pending", "capped"]),
      new ManualRetentionMappingSourceLengthRule(120),
      new ManualRetentionMappingCodePrefixRule("Q"),
    ],
  );
}
