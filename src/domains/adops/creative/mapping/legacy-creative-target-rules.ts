import { LegacyCreativeTarget } from "./legacy-creative-target.js";

/** A rule a legacy creative target must pass. Check returns its problems, or none. */
export interface LegacyCreativeTargetRule {
  check(item: LegacyCreativeTarget): string[];
}

export class LegacyCreativeTargetRequiredCampaignRefRule implements LegacyCreativeTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCreativeTarget): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCreativeTargetCodeLengthRule implements LegacyCreativeTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCreativeTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCreativeTargetUpdatedAtRangeRule implements LegacyCreativeTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCreativeTarget): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy creative target. */
export class LegacyCreativeTargetValidator {
  rules: LegacyCreativeTargetRule[];

  constructor(rules: LegacyCreativeTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCreativeTarget): string[] {
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

  requireValid(item: LegacyCreativeTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCreativeTarget[]): Map<string, string[]> {
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

export function defaultLegacyCreativeTargetValidator(): LegacyCreativeTargetValidator {
  return new LegacyCreativeTargetValidator(
    [
      new LegacyCreativeTargetRequiredCampaignRefRule("legacy creative target needs a value"),
      new LegacyCreativeTargetCodeLengthRule(16),
      new LegacyCreativeTargetUpdatedAtRangeRule(64, 80),
    ],
  );
}
