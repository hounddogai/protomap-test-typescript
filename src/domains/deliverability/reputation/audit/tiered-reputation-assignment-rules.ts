import { TieredReputationAssignment } from "./tiered-reputation-assignment.js";

/** A rule a tiered reputation assignment must pass. Check returns its problems, or none. */
export interface TieredReputationAssignmentRule {
  check(item: TieredReputationAssignment): string[];
}

export class TieredReputationAssignmentRequiredExternalRefRule implements TieredReputationAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredReputationAssignment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredReputationAssignmentRegionLengthRule implements TieredReputationAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReputationAssignment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReputationAssignmentExternalRefLengthRule implements TieredReputationAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReputationAssignment): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReputationAssignmentActiveGuardRule implements TieredReputationAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredReputationAssignment): string[] {
    if (item.active && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a tiered reputation assignment. */
export class TieredReputationAssignmentValidator {
  rules: TieredReputationAssignmentRule[];

  constructor(rules: TieredReputationAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredReputationAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredReputationAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredReputationAssignment[]): Map<string, string[]> {
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

export function defaultTieredReputationAssignmentValidator(): TieredReputationAssignmentValidator {
  return new TieredReputationAssignmentValidator(
    [
      new TieredReputationAssignmentRequiredExternalRefRule("tiered reputation assignment needs a value"),
      new TieredReputationAssignmentRegionLengthRule(86400),
      new TieredReputationAssignmentExternalRefLengthRule(1000),
      new TieredReputationAssignmentActiveGuardRule(64),
    ],
  );
}
