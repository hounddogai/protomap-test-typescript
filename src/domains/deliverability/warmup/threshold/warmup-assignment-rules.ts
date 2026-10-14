import { WarmupAssignment } from "./warmup-assignment.js";

/** A rule a warmup assignment must pass. Check returns its problems, or none. */
export interface WarmupAssignmentRule {
  check(item: WarmupAssignment): string[];
}

export class WarmupAssignmentRegionLengthRule implements WarmupAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupAssignment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupAssignmentRequiredCurrencyRule implements WarmupAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupAssignment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupAssignmentCurrencyLengthRule implements WarmupAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupAssignment): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupAssignmentActiveGuardRule implements WarmupAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WarmupAssignment): string[] {
    if (item.active && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a warmup assignment. */
export class WarmupAssignmentValidator {
  rules: WarmupAssignmentRule[];

  constructor(rules: WarmupAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupAssignment[]): Map<string, string[]> {
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

export function defaultWarmupAssignmentValidator(): WarmupAssignmentValidator {
  return new WarmupAssignmentValidator(
    [
      new WarmupAssignmentRegionLengthRule(86400),
      new WarmupAssignmentRequiredCurrencyRule("warmup assignment needs an entry"),
      new WarmupAssignmentCurrencyLengthRule(64),
      new WarmupAssignmentActiveGuardRule(255),
    ],
  );
}
