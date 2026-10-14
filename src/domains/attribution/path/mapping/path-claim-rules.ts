import * as text from "../../../../kit/text.js";
import { PathClaim } from "./path-claim.js";

/** A rule a path claim must pass. Check returns its problems, or none. */
export interface PathClaimRule {
  check(item: PathClaim): string[];
}

export class PathClaimAllowedTitleRule implements PathClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class PathClaimExternalRefLengthRule implements PathClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathClaim): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathClaimBatchSizeRangeRule implements PathClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathClaim): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a path claim. */
export class PathClaimValidator {
  rules: PathClaimRule[];

  constructor(rules: PathClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PathClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathClaim[]): Map<string, string[]> {
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

export function defaultPathClaimValidator(): PathClaimValidator {
  return new PathClaimValidator(
    [
      new PathClaimAllowedTitleRule(["batched"]),
      new PathClaimExternalRefLengthRule(255),
      new PathClaimBatchSizeRangeRule(3600, 86400),
    ],
  );
}
