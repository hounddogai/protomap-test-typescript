import * as text from "../../../../kit/text.js";
import { BadgeAllocation } from "./badge-allocation.js";

/** A rule a badge allocation must pass. Check returns its problems, or none. */
export interface BadgeAllocationRule {
  check(item: BadgeAllocation): string[];
}

export class BadgeAllocationNameLengthRule implements BadgeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeAllocationCampaignRefLengthRule implements BadgeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeAllocation): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeAllocationAllowedUnitRule implements BadgeAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is missing`];
    return [];
  }
}

export class BadgeAllocationCodeLengthRule implements BadgeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeAllocationRequiredUnitRule implements BadgeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeAllocation): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge allocation. */
export class BadgeAllocationValidator {
  rules: BadgeAllocationRule[];

  constructor(rules: BadgeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeAllocation[]): Map<string, string[]> {
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

export function defaultBadgeAllocationValidator(): BadgeAllocationValidator {
  return new BadgeAllocationValidator(
    [
      new BadgeAllocationNameLengthRule(86400),
      new BadgeAllocationCampaignRefLengthRule(64),
      new BadgeAllocationAllowedUnitRule(["regional"]),
      new BadgeAllocationCodeLengthRule(3600),
      new BadgeAllocationRequiredUnitRule("badge allocation needs this field"),
    ],
  );
}
