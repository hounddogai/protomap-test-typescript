import { SuppressionMapping } from "./suppression-mapping.js";

/** A rule a suppression mapping must pass. Check returns its problems, or none. */
export interface SuppressionMappingRule {
  check(item: SuppressionMapping): string[];
}

export class SuppressionMappingCostRangeRule implements SuppressionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionMapping): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionMappingRequiredChannelRule implements SuppressionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionMapping): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionMappingCodeLengthRule implements SuppressionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionMappingChannelLengthRule implements SuppressionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionMapping): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression mapping. */
export class SuppressionMappingValidator {
  rules: SuppressionMappingRule[];

  constructor(rules: SuppressionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionMapping): string[] {
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

  requireValid(item: SuppressionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionMapping[]): Map<string, string[]> {
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

export function defaultSuppressionMappingValidator(): SuppressionMappingValidator {
  return new SuppressionMappingValidator(
    [
      new SuppressionMappingCostRangeRule(8.9, 4580),
      new SuppressionMappingRequiredChannelRule("suppression mapping needs this field"),
      new SuppressionMappingCodeLengthRule(64),
      new SuppressionMappingChannelLengthRule(80),
    ],
  );
}
