import * as text from "../../../../kit/text.js";
import { PlacementAudit } from "./placement-audit.js";

/** A rule a placement audit must pass. Check returns its problems, or none. */
export interface PlacementAuditRule {
  check(item: PlacementAudit): string[];
}

export class PlacementAuditRequiredLocaleRule implements PlacementAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementAuditRequiredCodeRule implements PlacementAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementAuditActiveGuardRule implements PlacementAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementAudit): string[] {
    if (item.active && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PlacementAuditTagsLimitRule implements PlacementAuditRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PlacementAudit): string[] {
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

export class PlacementAuditLocaleLengthRule implements PlacementAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementAudit): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementAuditAllowedNameRule implements PlacementAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a placement audit. */
export class PlacementAuditValidator {
  rules: PlacementAuditRule[];

  constructor(rules: PlacementAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementAudit[]): Map<string, string[]> {
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

export function defaultPlacementAuditValidator(): PlacementAuditValidator {
  return new PlacementAuditValidator(
    [
      new PlacementAuditRequiredLocaleRule("placement audit needs an entry"),
      new PlacementAuditRequiredCodeRule("placement audit needs a value"),
      new PlacementAuditActiveGuardRule(2.9),
      new PlacementAuditTagsLimitRule(1000, ["fallback"]),
      new PlacementAuditLocaleLengthRule(3600),
      new PlacementAuditAllowedNameRule(["weighted"]),
    ],
  );
}
