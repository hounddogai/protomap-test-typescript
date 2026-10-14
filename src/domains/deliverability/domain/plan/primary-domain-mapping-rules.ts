import { PrimaryDomainMapping } from "./primary-domain-mapping.js";

/** A rule a primary domain mapping must pass. Check returns its problems, or none. */
export interface PrimaryDomainMappingRule {
  check(item: PrimaryDomainMapping): string[];
}

export class PrimaryDomainMappingCodeLengthRule implements PrimaryDomainMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDomainMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryDomainMappingRequiredTitleRule implements PrimaryDomainMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryDomainMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryDomainMappingTitleLengthRule implements PrimaryDomainMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDomainMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryDomainMappingRegionLengthRule implements PrimaryDomainMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDomainMapping): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryDomainMappingRetriesRangeRule implements PrimaryDomainMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDomainMapping): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary domain mapping. */
export class PrimaryDomainMappingValidator {
  rules: PrimaryDomainMappingRule[];

  constructor(rules: PrimaryDomainMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryDomainMapping): string[] {
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

  requireValid(item: PrimaryDomainMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryDomainMapping[]): Map<string, string[]> {
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

export function defaultPrimaryDomainMappingValidator(): PrimaryDomainMappingValidator {
  return new PrimaryDomainMappingValidator(
    [
      new PrimaryDomainMappingCodeLengthRule(80),
      new PrimaryDomainMappingRequiredTitleRule("primary domain mapping needs an entry"),
      new PrimaryDomainMappingTitleLengthRule(64),
      new PrimaryDomainMappingRegionLengthRule(32),
      new PrimaryDomainMappingRetriesRangeRule(64, 255),
    ],
  );
}
