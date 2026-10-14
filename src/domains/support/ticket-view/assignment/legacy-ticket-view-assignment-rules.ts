import * as text from "../../../../kit/text.js";
import { LegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

/** A rule a legacy ticket view assignment must pass. Check returns its problems, or none. */
export interface LegacyTicketViewAssignmentRule {
  check(item: LegacyTicketViewAssignment): string[];
}

export class LegacyTicketViewAssignmentSequenceRangeRule implements LegacyTicketViewAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTicketViewAssignment): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyTicketViewAssignmentPinnedGuardRule implements LegacyTicketViewAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyTicketViewAssignment): string[] {
    if (item.pinned && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacyTicketViewAssignmentRequiredCategoryRule implements LegacyTicketViewAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyTicketViewAssignment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyTicketViewAssignmentAllowedNameRule implements LegacyTicketViewAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyTicketViewAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a legacy ticket view assignment. */
export class LegacyTicketViewAssignmentValidator {
  rules: LegacyTicketViewAssignmentRule[];

  constructor(rules: LegacyTicketViewAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTicketViewAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyTicketViewAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTicketViewAssignment[]): Map<string, string[]> {
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

export function defaultLegacyTicketViewAssignmentValidator(): LegacyTicketViewAssignmentValidator {
  return new LegacyTicketViewAssignmentValidator(
    [
      new LegacyTicketViewAssignmentSequenceRangeRule(80, 120),
      new LegacyTicketViewAssignmentPinnedGuardRule(32),
      new LegacyTicketViewAssignmentRequiredCategoryRule("legacy ticket view assignment needs a value"),
      new LegacyTicketViewAssignmentAllowedNameRule(["adaptive", "fallback"]),
    ],
  );
}
