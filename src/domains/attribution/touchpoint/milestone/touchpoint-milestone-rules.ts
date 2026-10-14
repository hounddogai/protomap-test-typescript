import { TouchpointMilestone } from "./touchpoint-milestone.js";

/** A rule a touchpoint milestone must pass. Check returns its problems, or none. */
export interface TouchpointMilestoneRule {
  check(item: TouchpointMilestone): string[];
}

export class TouchpointMilestoneRequiredCodeRule implements TouchpointMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointMilestoneLimitRangeRule implements TouchpointMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointMilestone): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointMilestoneOpenRateRangeRule implements TouchpointMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointMilestone): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointMilestoneLabelLengthRule implements TouchpointMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointMilestoneRequiredLabelRule implements TouchpointMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointMilestoneCodeLengthRule implements TouchpointMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint milestone. */
export class TouchpointMilestoneValidator {
  rules: TouchpointMilestoneRule[];

  constructor(rules: TouchpointMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointMilestone): string[] {
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

  requireValid(item: TouchpointMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointMilestone[]): Map<string, string[]> {
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

export function defaultTouchpointMilestoneValidator(): TouchpointMilestoneValidator {
  return new TouchpointMilestoneValidator(
    [
      new TouchpointMilestoneRequiredCodeRule("touchpoint milestone needs a value"),
      new TouchpointMilestoneLimitRangeRule(64, 120),
      new TouchpointMilestoneOpenRateRangeRule(9.5, 1703.4),
      new TouchpointMilestoneLabelLengthRule(3600),
      new TouchpointMilestoneRequiredLabelRule("touchpoint milestone needs this field"),
      new TouchpointMilestoneCodeLengthRule(1000),
    ],
  );
}
