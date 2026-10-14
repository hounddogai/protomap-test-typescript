import { LegacyCsatMilestone } from "./legacy-csat-milestone.js";

/** A rule a legacy csat milestone must pass. Check returns its problems, or none. */
export interface LegacyCsatMilestoneRule {
  check(item: LegacyCsatMilestone): string[];
}

export class LegacyCsatMilestoneRevisionRangeRule implements LegacyCsatMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCsatMilestone): string[] {
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

export class LegacyCsatMilestoneTitleLengthRule implements LegacyCsatMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCsatMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCsatMilestoneCodeLengthRule implements LegacyCsatMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCsatMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCsatMilestoneRequiredChannelRule implements LegacyCsatMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCsatMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCsatMilestoneChannelLengthRule implements LegacyCsatMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCsatMilestone): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy csat milestone. */
export class LegacyCsatMilestoneValidator {
  rules: LegacyCsatMilestoneRule[];

  constructor(rules: LegacyCsatMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCsatMilestone): string[] {
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

  requireValid(item: LegacyCsatMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCsatMilestone[]): Map<string, string[]> {
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

export function defaultLegacyCsatMilestoneValidator(): LegacyCsatMilestoneValidator {
  return new LegacyCsatMilestoneValidator(
    [
      new LegacyCsatMilestoneRevisionRangeRule(32, 80),
      new LegacyCsatMilestoneTitleLengthRule(32),
      new LegacyCsatMilestoneCodeLengthRule(255),
      new LegacyCsatMilestoneRequiredChannelRule("legacy csat milestone needs an entry"),
      new LegacyCsatMilestoneChannelLengthRule(64),
    ],
  );
}
