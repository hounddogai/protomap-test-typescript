import * as text from "../../../../kit/text.js";
import { CreativeRule } from "./creative-rule.js";

/** A rule a creative rule must pass. Check returns its problems, or none. */
export interface CreativeRuleRule {
  check(item: CreativeRule): string[];
}

export class CreativeRuleCodePrefixRule implements CreativeRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeRuleAllowedChannelRule implements CreativeRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

export class CreativeRuleCodeLengthRule implements CreativeRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeRuleCreatedAtRangeRule implements CreativeRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeRule): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeRuleConversionRateRangeRule implements CreativeRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeRule): string[] {
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

/** Runs every rule of a creative rule. */
export class CreativeRuleValidator {
  rules: CreativeRuleRule[];

  constructor(rules: CreativeRuleRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeRule[]): Map<string, string[]> {
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

export function defaultCreativeRuleValidator(): CreativeRuleValidator {
  return new CreativeRuleValidator(
    [
      new CreativeRuleCodePrefixRule("OPS"),
      new CreativeRuleAllowedChannelRule(["lenient"]),
      new CreativeRuleCodeLengthRule(86400),
      new CreativeRuleCreatedAtRangeRule(120, 86400),
      new CreativeRuleConversionRateRangeRule(1.9, 3668.2),
    ],
  );
}
