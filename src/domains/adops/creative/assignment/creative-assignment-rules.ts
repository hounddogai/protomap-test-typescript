import { CreativeAssignment } from "./creative-assignment.js";

/** A rule a creative assignment must pass. Check returns its problems, or none. */
export interface CreativeAssignmentRule {
  check(item: CreativeAssignment): string[];
}

export class CreativeAssignmentRequiredNameRule implements CreativeAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeAssignmentRequiredCodeRule implements CreativeAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeAssignmentVariantLengthRule implements CreativeAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeAssignment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeAssignmentUpdatedAtRangeRule implements CreativeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeAssignment): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeAssignmentRequiredVariantRule implements CreativeAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeAssignment): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative assignment. */
export class CreativeAssignmentValidator {
  rules: CreativeAssignmentRule[];

  constructor(rules: CreativeAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeAssignment[]): Map<string, string[]> {
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

export function defaultCreativeAssignmentValidator(): CreativeAssignmentValidator {
  return new CreativeAssignmentValidator(
    [
      new CreativeAssignmentRequiredNameRule("creative assignment needs an entry"),
      new CreativeAssignmentRequiredCodeRule("creative assignment needs this field"),
      new CreativeAssignmentVariantLengthRule(1000),
      new CreativeAssignmentUpdatedAtRangeRule(86400, 86400),
      new CreativeAssignmentRequiredVariantRule("creative assignment needs this field"),
    ],
  );
}
