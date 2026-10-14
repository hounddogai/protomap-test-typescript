import { DomainAssignment } from "./domain-assignment.js";

/** A rule a domain assignment must pass. Check returns its problems, or none. */
export interface DomainAssignmentRule {
  check(item: DomainAssignment): string[];
}

export class DomainAssignmentRequiredLabelRule implements DomainAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DomainAssignmentRatioRangeRule implements DomainAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainAssignment): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainAssignmentLabelLengthRule implements DomainAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainAssignmentRequiredCodeRule implements DomainAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainAssignmentMaximumRangeRule implements DomainAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainAssignment): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainAssignmentQuantityRangeRule implements DomainAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainAssignment): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a domain assignment. */
export class DomainAssignmentValidator {
  rules: DomainAssignmentRule[];

  constructor(rules: DomainAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: DomainAssignment): string[] {
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

  requireValid(item: DomainAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainAssignment[]): Map<string, string[]> {
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

export function defaultDomainAssignmentValidator(): DomainAssignmentValidator {
  return new DomainAssignmentValidator(
    [
      new DomainAssignmentRequiredLabelRule("domain assignment needs an entry"),
      new DomainAssignmentRatioRangeRule(3.6, 458.8),
      new DomainAssignmentLabelLengthRule(80),
      new DomainAssignmentRequiredCodeRule("domain assignment needs a value"),
      new DomainAssignmentMaximumRangeRule(9.2, 4775.4),
      new DomainAssignmentQuantityRangeRule(16, 3600),
    ],
  );
}
