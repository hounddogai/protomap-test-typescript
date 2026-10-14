import { PlacementAssignment } from "./placement-assignment.js";

/** A rule a placement assignment must pass. Check returns its problems, or none. */
export interface PlacementAssignmentRule {
  check(item: PlacementAssignment): string[];
}

export class PlacementAssignmentCodeLengthRule implements PlacementAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementAssignmentRequiredNameRule implements PlacementAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementAssignmentContactEmailLengthRule implements PlacementAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementAssignment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementAssignmentCurrencyLengthRule implements PlacementAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementAssignment): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementAssignmentApprovedGuardRule implements PlacementAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementAssignment): string[] {
    if (item.approved && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a placement assignment. */
export class PlacementAssignmentValidator {
  rules: PlacementAssignmentRule[];

  constructor(rules: PlacementAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementAssignment): string[] {
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

  requireValid(item: PlacementAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementAssignment[]): Map<string, string[]> {
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

export function defaultPlacementAssignmentValidator(): PlacementAssignmentValidator {
  return new PlacementAssignmentValidator(
    [
      new PlacementAssignmentCodeLengthRule(120),
      new PlacementAssignmentRequiredNameRule("placement assignment needs this field"),
      new PlacementAssignmentContactEmailLengthRule(64),
      new PlacementAssignmentCurrencyLengthRule(80),
      new PlacementAssignmentApprovedGuardRule(5.5),
    ],
  );
}
