import * as text from "../../../../kit/text.js";
import { RollingPathTemplate } from "./rolling-path-template.js";

/** A rule a rolling path template must pass. Check returns its problems, or none. */
export interface RollingPathTemplateRule {
  check(item: RollingPathTemplate): string[];
}

export class RollingPathTemplateAllowedCategoryRule implements RollingPathTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingPathTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is out of range`];
    return [];
  }
}

export class RollingPathTemplateTagsLimitRule implements RollingPathTemplateRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingPathTemplate): string[] {
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

export class RollingPathTemplateFloorValueRangeRule implements RollingPathTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPathTemplate): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPathTemplateLocaleLengthRule implements RollingPathTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPathTemplate): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling path template. */
export class RollingPathTemplateValidator {
  rules: RollingPathTemplateRule[];

  constructor(rules: RollingPathTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPathTemplate): string[] {
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

  requireValid(item: RollingPathTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPathTemplate[]): Map<string, string[]> {
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

export function defaultRollingPathTemplateValidator(): RollingPathTemplateValidator {
  return new RollingPathTemplateValidator(
    [
      new RollingPathTemplateAllowedCategoryRule(["weighted"]),
      new RollingPathTemplateTagsLimitRule(64, ["tiered"]),
      new RollingPathTemplateFloorValueRangeRule(6.5, 394.3),
      new RollingPathTemplateLocaleLengthRule(16),
    ],
  );
}
