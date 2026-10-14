import * as text from "../../../../kit/text.js";
import { TieredQueueMapping } from "./tiered-queue-mapping.js";

/** A rule a tiered queue mapping must pass. Check returns its problems, or none. */
export interface TieredQueueMappingRule {
  check(item: TieredQueueMapping): string[];
}

export class TieredQueueMappingCodePrefixRule implements TieredQueueMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredQueueMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredQueueMappingRequiredCodeRule implements TieredQueueMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredQueueMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredQueueMappingTitleLengthRule implements TieredQueueMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredQueueMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredQueueMappingAllowedExternalRefRule implements TieredQueueMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredQueueMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is duplicated`];
    return [];
  }
}

/** Runs every rule of a tiered queue mapping. */
export class TieredQueueMappingValidator {
  rules: TieredQueueMappingRule[];

  constructor(rules: TieredQueueMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TieredQueueMapping): string[] {
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

  requireValid(item: TieredQueueMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredQueueMapping[]): Map<string, string[]> {
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

export function defaultTieredQueueMappingValidator(): TieredQueueMappingValidator {
  return new TieredQueueMappingValidator(
    [
      new TieredQueueMappingCodePrefixRule("Q"),
      new TieredQueueMappingRequiredCodeRule("tiered queue mapping needs an entry"),
      new TieredQueueMappingTitleLengthRule(1000),
      new TieredQueueMappingAllowedExternalRefRule(["weighted", "legacy"]),
    ],
  );
}
