import * as text from "../../../../kit/text.js";
import { PlacementClaim } from "./placement-claim.js";

/** A rule a placement claim must pass. Check returns its problems, or none. */
export interface PlacementClaimRule {
  check(item: PlacementClaim): string[];
}

export class PlacementClaimExpiresAtRangeRule implements PlacementClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementClaim): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementClaimAllowedChecksumRule implements PlacementClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is expired`];
    return [];
  }
}

export class PlacementClaimSequenceRangeRule implements PlacementClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementClaim): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementClaimTitleLengthRule implements PlacementClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementClaimSummaryLengthRule implements PlacementClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementClaim): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement claim. */
export class PlacementClaimValidator {
  rules: PlacementClaimRule[];

  constructor(rules: PlacementClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementClaim[]): Map<string, string[]> {
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

export function defaultPlacementClaimValidator(): PlacementClaimValidator {
  return new PlacementClaimValidator(
    [
      new PlacementClaimExpiresAtRangeRule(255, 3600),
      new PlacementClaimAllowedChecksumRule(["adaptive"]),
      new PlacementClaimSequenceRangeRule(3600, 86400),
      new PlacementClaimTitleLengthRule(80),
      new PlacementClaimSummaryLengthRule(3600),
    ],
  );
}
