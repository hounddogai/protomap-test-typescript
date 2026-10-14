import * as text from "../../../../kit/text.js";
import { InvitePlan } from "./invite-plan.js";

/** A rule a invite plan must pass. Check returns its problems, or none. */
export interface InvitePlanRule {
  check(item: InvitePlan): string[];
}

export class InvitePlanAllowedTimezoneRule implements InvitePlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InvitePlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is below minimum`];
    return [];
  }
}

export class InvitePlanRequiredUnitRule implements InvitePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InvitePlan): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class InvitePlanRequiredTitleRule implements InvitePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InvitePlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InvitePlanCodeLengthRule implements InvitePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InvitePlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InvitePlanSequenceRangeRule implements InvitePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InvitePlan): string[] {
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

/** Runs every rule of a invite plan. */
export class InvitePlanValidator {
  rules: InvitePlanRule[];

  constructor(rules: InvitePlanRule[]) {
    this.rules = rules;
  }

  validate(item: InvitePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InvitePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InvitePlan[]): Map<string, string[]> {
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

export function defaultInvitePlanValidator(): InvitePlanValidator {
  return new InvitePlanValidator(
    [
      new InvitePlanAllowedTimezoneRule(["default", "tiered", "adaptive"]),
      new InvitePlanRequiredUnitRule("invite plan needs an entry"),
      new InvitePlanRequiredTitleRule("invite plan needs this field"),
      new InvitePlanCodeLengthRule(120),
      new InvitePlanSequenceRangeRule(255, 3600),
    ],
  );
}
