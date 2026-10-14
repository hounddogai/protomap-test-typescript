import { WeightedWindowGroup } from "./weighted-window-group.js";

/** A rule a weighted window group must pass. Check returns its problems, or none. */
export interface WeightedWindowGroupRule {
  check(item: WeightedWindowGroup): string[];
}

export class WeightedWindowGroupRequiredChannelRule implements WeightedWindowGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowGroup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWindowGroupRequiredDescriptionRule implements WeightedWindowGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowGroup): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWindowGroupNameLengthRule implements WeightedWindowGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWindowGroupChannelLengthRule implements WeightedWindowGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowGroup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted window group. */
export class WeightedWindowGroupValidator {
  rules: WeightedWindowGroupRule[];

  constructor(rules: WeightedWindowGroupRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWindowGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWindowGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWindowGroup[]): Map<string, string[]> {
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

export function defaultWeightedWindowGroupValidator(): WeightedWindowGroupValidator {
  return new WeightedWindowGroupValidator(
    [
      new WeightedWindowGroupRequiredChannelRule("weighted window group needs a value"),
      new WeightedWindowGroupRequiredDescriptionRule("weighted window group needs this field"),
      new WeightedWindowGroupNameLengthRule(1000),
      new WeightedWindowGroupChannelLengthRule(3600),
    ],
  );
}
