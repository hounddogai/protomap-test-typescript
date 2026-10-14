import * as text from "../../../../kit/text.js";
import { PrimaryPlacementTier } from "./primary-placement-tier.js";

/** A rule a primary placement tier must pass. Check returns its problems, or none. */
export interface PrimaryPlacementTierRule {
  check(item: PrimaryPlacementTier): string[];
}

export class PrimaryPlacementTierTitleLengthRule implements PrimaryPlacementTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPlacementTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPlacementTierVariantLengthRule implements PrimaryPlacementTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPlacementTier): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPlacementTierAllowedCodeRule implements PrimaryPlacementTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPlacementTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a primary placement tier. */
export class PrimaryPlacementTierValidator {
  rules: PrimaryPlacementTierRule[];

  constructor(rules: PrimaryPlacementTierRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPlacementTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPlacementTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPlacementTier[]): Map<string, string[]> {
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

export function defaultPrimaryPlacementTierValidator(): PrimaryPlacementTierValidator {
  return new PrimaryPlacementTierValidator(
    [
      new PrimaryPlacementTierTitleLengthRule(16),
      new PrimaryPlacementTierVariantLengthRule(86400),
      new PrimaryPlacementTierAllowedCodeRule(["legacy"]),
    ],
  );
}
