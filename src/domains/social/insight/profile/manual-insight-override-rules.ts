import * as text from "../../../../kit/text.js";
import { ManualInsightOverride } from "./manual-insight-override.js";

/** A rule a manual insight override must pass. Check returns its problems, or none. */
export interface ManualInsightOverrideRule {
  check(item: ManualInsightOverride): string[];
}

export class ManualInsightOverrideAllowedTitleRule implements ManualInsightOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualInsightOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class ManualInsightOverrideRequiredOwnerIdRule implements ManualInsightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualInsightOverride): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ManualInsightOverrideQuantityRangeRule implements ManualInsightOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualInsightOverride): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualInsightOverrideCodeLengthRule implements ManualInsightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualInsightOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualInsightOverrideTagsLimitRule implements ManualInsightOverrideRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ManualInsightOverride): string[] {
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

export class ManualInsightOverrideTitleLengthRule implements ManualInsightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualInsightOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual insight override. */
export class ManualInsightOverrideValidator {
  rules: ManualInsightOverrideRule[];

  constructor(rules: ManualInsightOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ManualInsightOverride): string[] {
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

  requireValid(item: ManualInsightOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualInsightOverride[]): Map<string, string[]> {
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

export function defaultManualInsightOverrideValidator(): ManualInsightOverrideValidator {
  return new ManualInsightOverrideValidator(
    [
      new ManualInsightOverrideAllowedTitleRule(["seasonal"]),
      new ManualInsightOverrideRequiredOwnerIdRule("manual insight override needs a value"),
      new ManualInsightOverrideQuantityRangeRule(16, 1000),
      new ManualInsightOverrideCodeLengthRule(120),
      new ManualInsightOverrideTagsLimitRule(1000, ["rolling", "scheduled", "rolling"]),
      new ManualInsightOverrideTitleLengthRule(64),
    ],
  );
}
