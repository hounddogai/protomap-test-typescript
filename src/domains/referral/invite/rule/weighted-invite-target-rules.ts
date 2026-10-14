import * as text from "../../../../kit/text.js";
import { WeightedInviteTarget } from "./weighted-invite-target.js";

/** A rule a weighted invite target must pass. Check returns its problems, or none. */
export interface WeightedInviteTargetRule {
  check(item: WeightedInviteTarget): string[];
}

export class WeightedInviteTargetAllowedTitleRule implements WeightedInviteTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedInviteTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class WeightedInviteTargetTitleLengthRule implements WeightedInviteTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInviteTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInviteTargetCodeLengthRule implements WeightedInviteTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInviteTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInviteTargetUpdatedAtRangeRule implements WeightedInviteTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInviteTarget): string[] {
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

export class WeightedInviteTargetRequiredCodeRule implements WeightedInviteTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInviteTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted invite target. */
export class WeightedInviteTargetValidator {
  rules: WeightedInviteTargetRule[];

  constructor(rules: WeightedInviteTargetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInviteTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedInviteTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInviteTarget[]): Map<string, string[]> {
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

export function defaultWeightedInviteTargetValidator(): WeightedInviteTargetValidator {
  return new WeightedInviteTargetValidator(
    [
      new WeightedInviteTargetAllowedTitleRule(["seasonal", "tiered"]),
      new WeightedInviteTargetTitleLengthRule(1000),
      new WeightedInviteTargetCodeLengthRule(64),
      new WeightedInviteTargetUpdatedAtRangeRule(120, 86400),
      new WeightedInviteTargetRequiredCodeRule("weighted invite target needs a value"),
    ],
  );
}
