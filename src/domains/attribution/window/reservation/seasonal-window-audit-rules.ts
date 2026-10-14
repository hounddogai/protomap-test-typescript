import * as text from "../../../../kit/text.js";
import { SeasonalWindowAudit } from "./seasonal-window-audit.js";

/** A rule a seasonal window audit must pass. Check returns its problems, or none. */
export interface SeasonalWindowAuditRule {
  check(item: SeasonalWindowAudit): string[];
}

export class SeasonalWindowAuditRequiredSegmentRule implements SeasonalWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWindowAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWindowAuditArchivedGuardRule implements SeasonalWindowAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalWindowAudit): string[] {
    if (item.archived && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class SeasonalWindowAuditAllowedCodeRule implements SeasonalWindowAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalWindowAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class SeasonalWindowAuditRequiredNameRule implements SeasonalWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWindowAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWindowAuditRequiredCodeRule implements SeasonalWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWindowAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal window audit. */
export class SeasonalWindowAuditValidator {
  rules: SeasonalWindowAuditRule[];

  constructor(rules: SeasonalWindowAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWindowAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalWindowAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWindowAudit[]): Map<string, string[]> {
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

export function defaultSeasonalWindowAuditValidator(): SeasonalWindowAuditValidator {
  return new SeasonalWindowAuditValidator(
    [
      new SeasonalWindowAuditRequiredSegmentRule("seasonal window audit needs a value"),
      new SeasonalWindowAuditArchivedGuardRule(0.9),
      new SeasonalWindowAuditAllowedCodeRule([]),
      new SeasonalWindowAuditRequiredNameRule("seasonal window audit needs this field"),
      new SeasonalWindowAuditRequiredCodeRule("seasonal window audit needs a value"),
    ],
  );
}
