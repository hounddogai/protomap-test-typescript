import { BadgeMapping } from "./badge-mapping.js";

/** A rule a badge mapping must pass. Check returns its problems, or none. */
export interface BadgeMappingRule {
  check(item: BadgeMapping): string[];
}

export class BadgeMappingThresholdRangeRule implements BadgeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeMapping): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeMappingFrequencyCapRangeRule implements BadgeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeMapping): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeMappingRequiredChannelRule implements BadgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeMapping): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge mapping. */
export class BadgeMappingValidator {
  rules: BadgeMappingRule[];

  constructor(rules: BadgeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeMapping): string[] {
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

  requireValid(item: BadgeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeMapping[]): Map<string, string[]> {
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

export function defaultBadgeMappingValidator(): BadgeMappingValidator {
  return new BadgeMappingValidator(
    [
      new BadgeMappingThresholdRangeRule(4.8, 2491.2),
      new BadgeMappingFrequencyCapRangeRule(16, 1000),
      new BadgeMappingRequiredChannelRule("badge mapping needs an entry"),
    ],
  );
}
