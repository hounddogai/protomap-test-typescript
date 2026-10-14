import * as text from "../../../../kit/text.js";
import { SuppressionClaim } from "./suppression-claim.js";

/** A rule a suppression claim must pass. Check returns its problems, or none. */
export interface SuppressionClaimRule {
  check(item: SuppressionClaim): string[];
}

export class SuppressionClaimRequiredLabelRule implements SuppressionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionClaimCodeLengthRule implements SuppressionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionClaimNotesLengthRule implements SuppressionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionClaim): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionClaimRegionLengthRule implements SuppressionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionClaim): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionClaimAllowedRegionRule implements SuppressionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is duplicated`];
    return [];
  }
}

/** Runs every rule of a suppression claim. */
export class SuppressionClaimValidator {
  rules: SuppressionClaimRule[];

  constructor(rules: SuppressionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionClaim[]): Map<string, string[]> {
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

export function defaultSuppressionClaimValidator(): SuppressionClaimValidator {
  return new SuppressionClaimValidator(
    [
      new SuppressionClaimRequiredLabelRule("suppression claim needs an entry"),
      new SuppressionClaimCodeLengthRule(32),
      new SuppressionClaimNotesLengthRule(80),
      new SuppressionClaimRegionLengthRule(3600),
      new SuppressionClaimAllowedRegionRule([]),
    ],
  );
}
