import * as text from "../../../../kit/text.js";
import { TieredPathMapping } from "./tiered-path-mapping.js";

/** A rule a tiered path mapping must pass. Check returns its problems, or none. */
export interface TieredPathMappingRule {
  check(item: TieredPathMapping): string[];
}

export class TieredPathMappingLocaleLengthRule implements TieredPathMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPathMapping): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPathMappingVersionRangeRule implements TieredPathMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPathMapping): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredPathMappingNameLengthRule implements TieredPathMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPathMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPathMappingCodeLengthRule implements TieredPathMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPathMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPathMappingAllowedNameRule implements TieredPathMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPathMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a tiered path mapping. */
export class TieredPathMappingValidator {
  rules: TieredPathMappingRule[];

  constructor(rules: TieredPathMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPathMapping): string[] {
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

  requireValid(item: TieredPathMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPathMapping[]): Map<string, string[]> {
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

export function defaultTieredPathMappingValidator(): TieredPathMappingValidator {
  return new TieredPathMappingValidator(
    [
      new TieredPathMappingLocaleLengthRule(64),
      new TieredPathMappingVersionRangeRule(16, 3600),
      new TieredPathMappingNameLengthRule(86400),
      new TieredPathMappingCodeLengthRule(80),
      new TieredPathMappingAllowedNameRule([]),
    ],
  );
}
