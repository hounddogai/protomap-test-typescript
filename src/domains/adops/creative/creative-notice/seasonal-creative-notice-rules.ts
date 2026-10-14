import * as text from "../../../../kit/text.js";
import { SeasonalCreativeNotice } from "./seasonal-creative-notice.js";

/** A rule a seasonal creative notice must pass. Check returns its problems, or none. */
export interface SeasonalCreativeNoticeRule {
  check(item: SeasonalCreativeNotice): string[];
}

export class SeasonalCreativeNoticeCodePrefixRule implements SeasonalCreativeNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalCreativeNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalCreativeNoticeTagsLimitRule implements SeasonalCreativeNoticeRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SeasonalCreativeNotice): string[] {
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

export class SeasonalCreativeNoticeAllowedNameRule implements SeasonalCreativeNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalCreativeNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class SeasonalCreativeNoticeFloorValueRangeRule implements SeasonalCreativeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeNotice): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalCreativeNoticePriorityRangeRule implements SeasonalCreativeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeNotice): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalCreativeNoticeRequiredNameRule implements SeasonalCreativeNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCreativeNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal creative notice. */
export class SeasonalCreativeNoticeValidator {
  rules: SeasonalCreativeNoticeRule[];

  constructor(rules: SeasonalCreativeNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCreativeNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalCreativeNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCreativeNotice[]): Map<string, string[]> {
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

export function defaultSeasonalCreativeNoticeValidator(): SeasonalCreativeNoticeValidator {
  return new SeasonalCreativeNoticeValidator(
    [
      new SeasonalCreativeNoticeCodePrefixRule("ACM"),
      new SeasonalCreativeNoticeTagsLimitRule(3600, []),
      new SeasonalCreativeNoticeAllowedNameRule(["rolling", "capped"]),
      new SeasonalCreativeNoticeFloorValueRangeRule(3.8, 1616.8),
      new SeasonalCreativeNoticePriorityRangeRule(16, 3600),
      new SeasonalCreativeNoticeRequiredNameRule("seasonal creative notice needs this field"),
    ],
  );
}
