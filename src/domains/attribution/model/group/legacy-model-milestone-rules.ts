import { LegacyModelMilestone } from "./legacy-model-milestone.js";

/** A rule a legacy model milestone must pass. Check returns its problems, or none. */
export interface LegacyModelMilestoneRule {
  check(item: LegacyModelMilestone): string[];
}

export class LegacyModelMilestoneConversionRateRangeRule implements LegacyModelMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyModelMilestone): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyModelMilestoneRequiredChannelRule implements LegacyModelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyModelMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyModelMilestoneNameLengthRule implements LegacyModelMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyModelMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy model milestone. */
export class LegacyModelMilestoneValidator {
  rules: LegacyModelMilestoneRule[];

  constructor(rules: LegacyModelMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyModelMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyModelMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyModelMilestone[]): Map<string, string[]> {
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

export function defaultLegacyModelMilestoneValidator(): LegacyModelMilestoneValidator {
  return new LegacyModelMilestoneValidator(
    [
      new LegacyModelMilestoneConversionRateRangeRule(4.6, 3328.1),
      new LegacyModelMilestoneRequiredChannelRule("legacy model milestone needs a value"),
      new LegacyModelMilestoneNameLengthRule(86400),
    ],
  );
}
