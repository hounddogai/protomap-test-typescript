import { LegacyModelDraft } from "./legacy-model-draft.js";

/** A rule a legacy model draft must pass. Check returns its problems, or none. */
export interface LegacyModelDraftRule {
  check(item: LegacyModelDraft): string[];
}

export class LegacyModelDraftTagsLimitRule implements LegacyModelDraftRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LegacyModelDraft): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class LegacyModelDraftCodePrefixRule implements LegacyModelDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyModelDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyModelDraftBudgetRangeRule implements LegacyModelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyModelDraft): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy model draft. */
export class LegacyModelDraftValidator {
  rules: LegacyModelDraftRule[];

  constructor(rules: LegacyModelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyModelDraft): string[] {
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

  requireValid(item: LegacyModelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyModelDraft[]): Map<string, string[]> {
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

export function defaultLegacyModelDraftValidator(): LegacyModelDraftValidator {
  return new LegacyModelDraftValidator(
    [
      new LegacyModelDraftTagsLimitRule(120, []),
      new LegacyModelDraftCodePrefixRule("X"),
      new LegacyModelDraftBudgetRangeRule(5.9, 1393.3),
    ],
  );
}
