import * as text from "../../../../kit/text.js";
import { StrictPreferenceMilestone } from "./strict-preference-milestone.js";

/** A rule a strict preference milestone must pass. Check returns its problems, or none. */
export interface StrictPreferenceMilestoneRule {
  check(item: StrictPreferenceMilestone): string[];
}

export class StrictPreferenceMilestoneRequiredTimezoneRule implements StrictPreferenceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPreferenceMilestone): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPreferenceMilestoneAllowedNameRule implements StrictPreferenceMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPreferenceMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class StrictPreferenceMilestoneUnitLengthRule implements StrictPreferenceMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPreferenceMilestone): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPreferenceMilestoneRequiredUnitRule implements StrictPreferenceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPreferenceMilestone): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPreferenceMilestoneNameLengthRule implements StrictPreferenceMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPreferenceMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict preference milestone. */
export class StrictPreferenceMilestoneValidator {
  rules: StrictPreferenceMilestoneRule[];

  constructor(rules: StrictPreferenceMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPreferenceMilestone): string[] {
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

  requireValid(item: StrictPreferenceMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPreferenceMilestone[]): Map<string, string[]> {
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

export function defaultStrictPreferenceMilestoneValidator(): StrictPreferenceMilestoneValidator {
  return new StrictPreferenceMilestoneValidator(
    [
      new StrictPreferenceMilestoneRequiredTimezoneRule("strict preference milestone needs an entry"),
      new StrictPreferenceMilestoneAllowedNameRule(["capped", "fallback"]),
      new StrictPreferenceMilestoneUnitLengthRule(32),
      new StrictPreferenceMilestoneRequiredUnitRule("strict preference milestone needs an entry"),
      new StrictPreferenceMilestoneNameLengthRule(3600),
    ],
  );
}
