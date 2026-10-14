import { InsightMapping } from "./insight-mapping.js";

/** A rule a insight mapping must pass. Check returns its problems, or none. */
export interface InsightMappingRule {
  check(item: InsightMapping): string[];
}

export class InsightMappingRequiredChannelRule implements InsightMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightMapping): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class InsightMappingChannelLengthRule implements InsightMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightMapping): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightMappingSourceLengthRule implements InsightMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightMapping): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a insight mapping. */
export class InsightMappingValidator {
  rules: InsightMappingRule[];

  constructor(rules: InsightMappingRule[]) {
    this.rules = rules;
  }

  validate(item: InsightMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightMapping[]): Map<string, string[]> {
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

export function defaultInsightMappingValidator(): InsightMappingValidator {
  return new InsightMappingValidator(
    [
      new InsightMappingRequiredChannelRule("insight mapping needs a value"),
      new InsightMappingChannelLengthRule(80),
      new InsightMappingSourceLengthRule(255),
    ],
  );
}
