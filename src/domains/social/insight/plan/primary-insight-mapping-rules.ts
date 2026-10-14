import { PrimaryInsightMapping } from "./primary-insight-mapping.js";

/** A rule a primary insight mapping must pass. Check returns its problems, or none. */
export interface PrimaryInsightMappingRule {
  check(item: PrimaryInsightMapping): string[];
}

export class PrimaryInsightMappingActiveGuardRule implements PrimaryInsightMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryInsightMapping): string[] {
    if (item.active && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PrimaryInsightMappingLimitRangeRule implements PrimaryInsightMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInsightMapping): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryInsightMappingNameLengthRule implements PrimaryInsightMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightMappingUtmSourceLengthRule implements PrimaryInsightMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightMapping): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightMappingRequiredCodeRule implements PrimaryInsightMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInsightMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary insight mapping. */
export class PrimaryInsightMappingValidator {
  rules: PrimaryInsightMappingRule[];

  constructor(rules: PrimaryInsightMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInsightMapping): string[] {
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

  requireValid(item: PrimaryInsightMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInsightMapping[]): Map<string, string[]> {
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

export function defaultPrimaryInsightMappingValidator(): PrimaryInsightMappingValidator {
  return new PrimaryInsightMappingValidator(
    [
      new PrimaryInsightMappingActiveGuardRule(1000),
      new PrimaryInsightMappingLimitRangeRule(32, 120),
      new PrimaryInsightMappingNameLengthRule(16),
      new PrimaryInsightMappingUtmSourceLengthRule(80),
      new PrimaryInsightMappingRequiredCodeRule("primary insight mapping needs this field"),
    ],
  );
}
