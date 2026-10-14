import * as text from "../../../../kit/text.js";
import { RollingMacroEntry } from "./rolling-macro-entry.js";

/** A rule a rolling macro entry must pass. Check returns its problems, or none. */
export interface RollingMacroEntryRule {
  check(item: RollingMacroEntry): string[];
}

export class RollingMacroEntryPinnedGuardRule implements RollingMacroEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingMacroEntry): string[] {
    if (item.pinned && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RollingMacroEntryAllowedCodeRule implements RollingMacroEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingMacroEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class RollingMacroEntryPriorityRangeRule implements RollingMacroEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMacroEntry): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingMacroEntryTagsLimitRule implements RollingMacroEntryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingMacroEntry): string[] {
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

/** Runs every rule of a rolling macro entry. */
export class RollingMacroEntryValidator {
  rules: RollingMacroEntryRule[];

  constructor(rules: RollingMacroEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingMacroEntry): string[] {
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

  requireValid(item: RollingMacroEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingMacroEntry[]): Map<string, string[]> {
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

export function defaultRollingMacroEntryValidator(): RollingMacroEntryValidator {
  return new RollingMacroEntryValidator(
    [
      new RollingMacroEntryPinnedGuardRule(32),
      new RollingMacroEntryAllowedCodeRule([]),
      new RollingMacroEntryPriorityRangeRule(255, 1000),
      new RollingMacroEntryTagsLimitRule(120, []),
    ],
  );
}
