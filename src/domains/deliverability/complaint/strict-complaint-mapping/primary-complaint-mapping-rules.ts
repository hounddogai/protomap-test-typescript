import * as text from "../../../../kit/text.js";
import { PrimaryComplaintMapping } from "./primary-complaint-mapping.js";

/** A rule a primary complaint mapping must pass. Check returns its problems, or none. */
export interface PrimaryComplaintMappingRule {
  check(item: PrimaryComplaintMapping): string[];
}

export class PrimaryComplaintMappingAllowedVariantRule implements PrimaryComplaintMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryComplaintMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is blocked`];
    return [];
  }
}

export class PrimaryComplaintMappingOwnerIdLengthRule implements PrimaryComplaintMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryComplaintMapping): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryComplaintMappingCapacityRangeRule implements PrimaryComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryComplaintMapping): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryComplaintMappingNameLengthRule implements PrimaryComplaintMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryComplaintMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryComplaintMappingCodeLengthRule implements PrimaryComplaintMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryComplaintMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryComplaintMappingWeightRangeRule implements PrimaryComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryComplaintMapping): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary complaint mapping. */
export class PrimaryComplaintMappingValidator {
  rules: PrimaryComplaintMappingRule[];

  constructor(rules: PrimaryComplaintMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryComplaintMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryComplaintMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryComplaintMapping[]): Map<string, string[]> {
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

export function defaultPrimaryComplaintMappingValidator(): PrimaryComplaintMappingValidator {
  return new PrimaryComplaintMappingValidator(
    [
      new PrimaryComplaintMappingAllowedVariantRule(["primary", "legacy"]),
      new PrimaryComplaintMappingOwnerIdLengthRule(86400),
      new PrimaryComplaintMappingCapacityRangeRule(255, 86400),
      new PrimaryComplaintMappingNameLengthRule(32),
      new PrimaryComplaintMappingCodeLengthRule(86400),
      new PrimaryComplaintMappingWeightRangeRule(4, 509.6),
    ],
  );
}
