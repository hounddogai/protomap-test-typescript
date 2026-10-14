import { StrictNudgeMapping } from "./strict-nudge-mapping.js";

/** A rule a strict nudge mapping must pass. Check returns its problems, or none. */
export interface StrictNudgeMappingRule {
  check(item: StrictNudgeMapping): string[];
}

export class StrictNudgeMappingOpenRateRangeRule implements StrictNudgeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictNudgeMapping): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictNudgeMappingChecksumLengthRule implements StrictNudgeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictNudgeMapping): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictNudgeMappingRequiredNameRule implements StrictNudgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictNudgeMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictNudgeMappingAttemptsRangeRule implements StrictNudgeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictNudgeMapping): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictNudgeMappingRequiredLocaleRule implements StrictNudgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictNudgeMapping): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class StrictNudgeMappingLocaleLengthRule implements StrictNudgeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictNudgeMapping): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict nudge mapping. */
export class StrictNudgeMappingValidator {
  rules: StrictNudgeMappingRule[];

  constructor(rules: StrictNudgeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: StrictNudgeMapping): string[] {
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

  requireValid(item: StrictNudgeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictNudgeMapping[]): Map<string, string[]> {
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

export function defaultStrictNudgeMappingValidator(): StrictNudgeMappingValidator {
  return new StrictNudgeMappingValidator(
    [
      new StrictNudgeMappingOpenRateRangeRule(6.3, 4104.8),
      new StrictNudgeMappingChecksumLengthRule(1000),
      new StrictNudgeMappingRequiredNameRule("strict nudge mapping needs an entry"),
      new StrictNudgeMappingAttemptsRangeRule(64, 3600),
      new StrictNudgeMappingRequiredLocaleRule("strict nudge mapping needs this field"),
      new StrictNudgeMappingLocaleLengthRule(86400),
    ],
  );
}
