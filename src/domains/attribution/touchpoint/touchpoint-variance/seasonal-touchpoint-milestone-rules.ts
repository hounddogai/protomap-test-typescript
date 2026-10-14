import * as text from "../../../../kit/text.js";
import { SeasonalTouchpointMilestone } from "./seasonal-touchpoint-milestone.js";

/** A rule a seasonal touchpoint milestone must pass. Check returns its problems, or none. */
export interface SeasonalTouchpointMilestoneRule {
  check(item: SeasonalTouchpointMilestone): string[];
}

export class SeasonalTouchpointMilestoneSourceLengthRule implements SeasonalTouchpointMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTouchpointMilestone): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTouchpointMilestoneCreatedAtRangeRule implements SeasonalTouchpointMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalTouchpointMilestone): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalTouchpointMilestoneFloorValueRangeRule implements SeasonalTouchpointMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalTouchpointMilestone): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalTouchpointMilestoneAllowedSourceRule implements SeasonalTouchpointMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalTouchpointMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is expired`];
    return [];
  }
}

export class SeasonalTouchpointMilestoneCodePrefixRule implements SeasonalTouchpointMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalTouchpointMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal touchpoint milestone. */
export class SeasonalTouchpointMilestoneValidator {
  rules: SeasonalTouchpointMilestoneRule[];

  constructor(rules: SeasonalTouchpointMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTouchpointMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalTouchpointMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTouchpointMilestone[]): Map<string, string[]> {
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

export function defaultSeasonalTouchpointMilestoneValidator(): SeasonalTouchpointMilestoneValidator {
  return new SeasonalTouchpointMilestoneValidator(
    [
      new SeasonalTouchpointMilestoneSourceLengthRule(86400),
      new SeasonalTouchpointMilestoneCreatedAtRangeRule(16, 255),
      new SeasonalTouchpointMilestoneFloorValueRangeRule(5.4, 582.3),
      new SeasonalTouchpointMilestoneAllowedSourceRule(["default", "fallback"]),
      new SeasonalTouchpointMilestoneCodePrefixRule("X"),
    ],
  );
}
