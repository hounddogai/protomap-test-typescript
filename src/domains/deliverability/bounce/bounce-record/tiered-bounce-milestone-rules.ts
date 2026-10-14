import { TieredBounceMilestone } from "./tiered-bounce-milestone.js";

/** A rule a tiered bounce milestone must pass. Check returns its problems, or none. */
export interface TieredBounceMilestoneRule {
  check(item: TieredBounceMilestone): string[];
}

export class TieredBounceMilestoneRequiredNameRule implements TieredBounceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceMilestoneCodePrefixRule implements TieredBounceMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredBounceMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredBounceMilestoneNameLengthRule implements TieredBounceMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBounceMilestoneRequiredTitleRule implements TieredBounceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceMilestoneRatioRangeRule implements TieredBounceMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceMilestone): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredBounceMilestoneTitleLengthRule implements TieredBounceMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered bounce milestone. */
export class TieredBounceMilestoneValidator {
  rules: TieredBounceMilestoneRule[];

  constructor(rules: TieredBounceMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBounceMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredBounceMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBounceMilestone[]): Map<string, string[]> {
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

export function defaultTieredBounceMilestoneValidator(): TieredBounceMilestoneValidator {
  return new TieredBounceMilestoneValidator(
    [
      new TieredBounceMilestoneRequiredNameRule("tiered bounce milestone needs an entry"),
      new TieredBounceMilestoneCodePrefixRule("Q"),
      new TieredBounceMilestoneNameLengthRule(3600),
      new TieredBounceMilestoneRequiredTitleRule("tiered bounce milestone needs this field"),
      new TieredBounceMilestoneRatioRangeRule(8.9, 4133.9),
      new TieredBounceMilestoneTitleLengthRule(120),
    ],
  );
}
