import { ChallengeMapping } from "./challenge-mapping.js";

/** A rule a challenge mapping must pass. Check returns its problems, or none. */
export interface ChallengeMappingRule {
  check(item: ChallengeMapping): string[];
}

export class ChallengeMappingWeightRangeRule implements ChallengeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeMapping): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeMappingLabelLengthRule implements ChallengeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeMappingRequiredOwnerIdRule implements ChallengeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeMapping): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeMappingRequiredCurrencyRule implements ChallengeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeMapping): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeMappingRequiredCodeRule implements ChallengeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeMappingCodePrefixRule implements ChallengeMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a challenge mapping. */
export class ChallengeMappingValidator {
  rules: ChallengeMappingRule[];

  constructor(rules: ChallengeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeMapping[]): Map<string, string[]> {
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

export function defaultChallengeMappingValidator(): ChallengeMappingValidator {
  return new ChallengeMappingValidator(
    [
      new ChallengeMappingWeightRangeRule(5.7, 4246.4),
      new ChallengeMappingLabelLengthRule(255),
      new ChallengeMappingRequiredOwnerIdRule("challenge mapping needs a value"),
      new ChallengeMappingRequiredCurrencyRule("challenge mapping needs an entry"),
      new ChallengeMappingRequiredCodeRule("challenge mapping needs an entry"),
      new ChallengeMappingCodePrefixRule("OPS"),
    ],
  );
}
