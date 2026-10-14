import * as text from "../../../../kit/text.js";
import { BadgeMilestone } from "./badge-milestone.js";

/** A rule a badge milestone must pass. Check returns its problems, or none. */
export interface BadgeMilestoneRule {
  check(item: BadgeMilestone): string[];
}

export class BadgeMilestoneLimitRangeRule implements BadgeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeMilestone): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeMilestoneCodePrefixRule implements BadgeMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeMilestoneAllowedNameRule implements BadgeMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class BadgeMilestoneMinimumRangeRule implements BadgeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeMilestone): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeMilestoneRequiredRegionRule implements BadgeMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeMilestone): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeMilestoneRevisionRangeRule implements BadgeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeMilestone): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a badge milestone. */
export class BadgeMilestoneValidator {
  rules: BadgeMilestoneRule[];

  constructor(rules: BadgeMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeMilestone[]): Map<string, string[]> {
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

export function defaultBadgeMilestoneValidator(): BadgeMilestoneValidator {
  return new BadgeMilestoneValidator(
    [
      new BadgeMilestoneLimitRangeRule(32, 3600),
      new BadgeMilestoneCodePrefixRule("REF"),
      new BadgeMilestoneAllowedNameRule(["regional"]),
      new BadgeMilestoneMinimumRangeRule(7.1, 364.9),
      new BadgeMilestoneRequiredRegionRule("badge milestone needs a value"),
      new BadgeMilestoneRevisionRangeRule(16, 80),
    ],
  );
}
