import { ActivationAssignment } from "./activation-assignment.js";

/** A rule a activation assignment must pass. Check returns its problems, or none. */
export interface ActivationAssignmentRule {
  check(item: ActivationAssignment): string[];
}

export class ActivationAssignmentNameLengthRule implements ActivationAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationAssignmentCodePrefixRule implements ActivationAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationAssignmentRequiredContactEmailRule implements ActivationAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationAssignment): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationAssignmentAmountRangeRule implements ActivationAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationAssignment): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationAssignmentCodeLengthRule implements ActivationAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation assignment. */
export class ActivationAssignmentValidator {
  rules: ActivationAssignmentRule[];

  constructor(rules: ActivationAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationAssignment): string[] {
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

  requireValid(item: ActivationAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationAssignment[]): Map<string, string[]> {
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

export function defaultActivationAssignmentValidator(): ActivationAssignmentValidator {
  return new ActivationAssignmentValidator(
    [
      new ActivationAssignmentNameLengthRule(80),
      new ActivationAssignmentCodePrefixRule("OPS"),
      new ActivationAssignmentRequiredContactEmailRule("activation assignment needs a value"),
      new ActivationAssignmentAmountRangeRule(4.1, 3671.3),
      new ActivationAssignmentCodeLengthRule(120),
    ],
  );
}
