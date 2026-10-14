import { RollingPacingAllocation } from "./rolling-pacing-allocation.js";

/** A rule a rolling pacing allocation must pass. Check returns its problems, or none. */
export interface RollingPacingAllocationRule {
  check(item: RollingPacingAllocation): string[];
}

export class RollingPacingAllocationLabelLengthRule implements RollingPacingAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingAllocationUtmSourceLengthRule implements RollingPacingAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingAllocation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingAllocationCodeLengthRule implements RollingPacingAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingAllocationRequiredCodeRule implements RollingPacingAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPacingAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPacingAllocationOwnerIdLengthRule implements RollingPacingAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingAllocation): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling pacing allocation. */
export class RollingPacingAllocationValidator {
  rules: RollingPacingAllocationRule[];

  constructor(rules: RollingPacingAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPacingAllocation): string[] {
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

  requireValid(item: RollingPacingAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPacingAllocation[]): Map<string, string[]> {
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

export function defaultRollingPacingAllocationValidator(): RollingPacingAllocationValidator {
  return new RollingPacingAllocationValidator(
    [
      new RollingPacingAllocationLabelLengthRule(120),
      new RollingPacingAllocationUtmSourceLengthRule(64),
      new RollingPacingAllocationCodeLengthRule(1000),
      new RollingPacingAllocationRequiredCodeRule("rolling pacing allocation needs this field"),
      new RollingPacingAllocationOwnerIdLengthRule(1000),
    ],
  );
}
