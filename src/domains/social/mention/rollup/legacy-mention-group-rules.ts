import { LegacyMentionGroup } from "./legacy-mention-group.js";

/** A rule a legacy mention group must pass. Check returns its problems, or none. */
export interface LegacyMentionGroupRule {
  check(item: LegacyMentionGroup): string[];
}

export class LegacyMentionGroupCodePrefixRule implements LegacyMentionGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyMentionGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyMentionGroupRequiredLabelRule implements LegacyMentionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyMentionGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyMentionGroupRequiredCategoryRule implements LegacyMentionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyMentionGroup): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyMentionGroupMinimumRangeRule implements LegacyMentionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyMentionGroup): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy mention group. */
export class LegacyMentionGroupValidator {
  rules: LegacyMentionGroupRule[];

  constructor(rules: LegacyMentionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyMentionGroup): string[] {
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

  requireValid(item: LegacyMentionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyMentionGroup[]): Map<string, string[]> {
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

export function defaultLegacyMentionGroupValidator(): LegacyMentionGroupValidator {
  return new LegacyMentionGroupValidator(
    [
      new LegacyMentionGroupCodePrefixRule("REF"),
      new LegacyMentionGroupRequiredLabelRule("legacy mention group needs a value"),
      new LegacyMentionGroupRequiredCategoryRule("legacy mention group needs an entry"),
      new LegacyMentionGroupMinimumRangeRule(6.5, 3658.3),
    ],
  );
}
