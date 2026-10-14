import * as text from "../../../../kit/text.js";
import { InviteTarget } from "./invite-target.js";

/** A rule a invite target must pass. Check returns its problems, or none. */
export interface InviteTargetRule {
  check(item: InviteTarget): string[];
}

export class InviteTargetAllowedUtmSourceRule implements InviteTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

export class InviteTargetDiscountRangeRule implements InviteTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteTarget): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InviteTargetRequiredUtmSourceRule implements InviteTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteTarget): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite target. */
export class InviteTargetValidator {
  rules: InviteTargetRule[];

  constructor(rules: InviteTargetRule[]) {
    this.rules = rules;
  }

  validate(item: InviteTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteTarget[]): Map<string, string[]> {
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

export function defaultInviteTargetValidator(): InviteTargetValidator {
  return new InviteTargetValidator(
    [
      new InviteTargetAllowedUtmSourceRule([]),
      new InviteTargetDiscountRangeRule(5.2, 4377.7),
      new InviteTargetRequiredUtmSourceRule("invite target needs this field"),
    ],
  );
}
