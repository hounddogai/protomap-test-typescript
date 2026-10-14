import * as text from "../../../../kit/text.js";
import { GlobalLevelAssignment } from "./global-level-assignment.js";

/** A rule a global level assignment must pass. Check returns its problems, or none. */
export interface GlobalLevelAssignmentRule {
  check(item: GlobalLevelAssignment): string[];
}

export class GlobalLevelAssignmentCodeLengthRule implements GlobalLevelAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalLevelAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalLevelAssignmentAllowedNameRule implements GlobalLevelAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalLevelAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class GlobalLevelAssignmentRequiredCodeRule implements GlobalLevelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalLevelAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalLevelAssignmentCodePrefixRule implements GlobalLevelAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalLevelAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalLevelAssignmentRequiredNameRule implements GlobalLevelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalLevelAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global level assignment. */
export class GlobalLevelAssignmentValidator {
  rules: GlobalLevelAssignmentRule[];

  constructor(rules: GlobalLevelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalLevelAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalLevelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalLevelAssignment[]): Map<string, string[]> {
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

export function defaultGlobalLevelAssignmentValidator(): GlobalLevelAssignmentValidator {
  return new GlobalLevelAssignmentValidator(
    [
      new GlobalLevelAssignmentCodeLengthRule(16),
      new GlobalLevelAssignmentAllowedNameRule([]),
      new GlobalLevelAssignmentRequiredCodeRule("global level assignment needs this field"),
      new GlobalLevelAssignmentCodePrefixRule("Q"),
      new GlobalLevelAssignmentRequiredNameRule("global level assignment needs this field"),
    ],
  );
}
