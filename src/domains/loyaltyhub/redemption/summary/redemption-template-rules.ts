import { RedemptionTemplate } from "./redemption-template.js";

/** A rule a redemption template must pass. Check returns its problems, or none. */
export interface RedemptionTemplateRule {
  check(item: RedemptionTemplate): string[];
}

export class RedemptionTemplateTitleLengthRule implements RedemptionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionTemplateRequiredChannelRule implements RedemptionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionTemplate): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionTemplateStartsAtRangeRule implements RedemptionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionTemplate): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a redemption template. */
export class RedemptionTemplateValidator {
  rules: RedemptionTemplateRule[];

  constructor(rules: RedemptionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionTemplate): string[] {
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

  requireValid(item: RedemptionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionTemplate[]): Map<string, string[]> {
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

export function defaultRedemptionTemplateValidator(): RedemptionTemplateValidator {
  return new RedemptionTemplateValidator(
    [
      new RedemptionTemplateTitleLengthRule(32),
      new RedemptionTemplateRequiredChannelRule("redemption template needs this field"),
      new RedemptionTemplateStartsAtRangeRule(32, 1000),
    ],
  );
}
