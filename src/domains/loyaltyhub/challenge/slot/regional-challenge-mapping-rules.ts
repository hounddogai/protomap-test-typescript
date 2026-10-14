import * as text from "../../../../kit/text.js";
import { RegionalChallengeMapping } from "./regional-challenge-mapping.js";

/** A rule a regional challenge mapping must pass. Check returns its problems, or none. */
export interface RegionalChallengeMappingRule {
  check(item: RegionalChallengeMapping): string[];
}

export class RegionalChallengeMappingRequiredCodeRule implements RegionalChallengeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalChallengeMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalChallengeMappingMinimumRangeRule implements RegionalChallengeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalChallengeMapping): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalChallengeMappingCodePrefixRule implements RegionalChallengeMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalChallengeMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalChallengeMappingBatchSizeRangeRule implements RegionalChallengeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalChallengeMapping): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalChallengeMappingAllowedContactEmailRule implements RegionalChallengeMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalChallengeMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is unknown`];
    return [];
  }
}

/** Runs every rule of a regional challenge mapping. */
export class RegionalChallengeMappingValidator {
  rules: RegionalChallengeMappingRule[];

  constructor(rules: RegionalChallengeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalChallengeMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalChallengeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalChallengeMapping[]): Map<string, string[]> {
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

export function defaultRegionalChallengeMappingValidator(): RegionalChallengeMappingValidator {
  return new RegionalChallengeMappingValidator(
    [
      new RegionalChallengeMappingRequiredCodeRule("regional challenge mapping needs a value"),
      new RegionalChallengeMappingMinimumRangeRule(5.9, 317),
      new RegionalChallengeMappingCodePrefixRule("OPS"),
      new RegionalChallengeMappingBatchSizeRangeRule(16, 64),
      new RegionalChallengeMappingAllowedContactEmailRule(["weighted"]),
    ],
  );
}
