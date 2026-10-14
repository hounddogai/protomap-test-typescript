import { RollingPlacementException } from "./rolling-placement-exception.js";

/** A rule a rolling placement exception must pass. Check returns its problems, or none. */
export interface RollingPlacementExceptionRule {
  check(item: RollingPlacementException): string[];
}

export class RollingPlacementExceptionOwnerIdLengthRule implements RollingPlacementExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPlacementException): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPlacementExceptionRequiredCodeRule implements RollingPlacementExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPlacementException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPlacementExceptionNameLengthRule implements RollingPlacementExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPlacementException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling placement exception. */
export class RollingPlacementExceptionValidator {
  rules: RollingPlacementExceptionRule[];

  constructor(rules: RollingPlacementExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPlacementException): string[] {
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

  requireValid(item: RollingPlacementException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPlacementException[]): Map<string, string[]> {
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

export function defaultRollingPlacementExceptionValidator(): RollingPlacementExceptionValidator {
  return new RollingPlacementExceptionValidator(
    [
      new RollingPlacementExceptionOwnerIdLengthRule(1000),
      new RollingPlacementExceptionRequiredCodeRule("rolling placement exception needs an entry"),
      new RollingPlacementExceptionNameLengthRule(1000),
    ],
  );
}
