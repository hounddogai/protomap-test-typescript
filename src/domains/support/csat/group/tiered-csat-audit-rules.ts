import { TieredCsatAudit } from "./tiered-csat-audit.js";

/** A rule a tiered csat audit must pass. Check returns its problems, or none. */
export interface TieredCsatAuditRule {
  check(item: TieredCsatAudit): string[];
}

export class TieredCsatAuditRequiredCodeRule implements TieredCsatAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCsatAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCsatAuditBudgetRangeRule implements TieredCsatAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCsatAudit): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredCsatAuditRequiredJourneyIdRule implements TieredCsatAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCsatAudit): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCsatAuditCeilingRangeRule implements TieredCsatAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCsatAudit): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredCsatAuditCodePrefixRule implements TieredCsatAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredCsatAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered csat audit. */
export class TieredCsatAuditValidator {
  rules: TieredCsatAuditRule[];

  constructor(rules: TieredCsatAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCsatAudit): string[] {
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

  requireValid(item: TieredCsatAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCsatAudit[]): Map<string, string[]> {
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

export function defaultTieredCsatAuditValidator(): TieredCsatAuditValidator {
  return new TieredCsatAuditValidator(
    [
      new TieredCsatAuditRequiredCodeRule("tiered csat audit needs an entry"),
      new TieredCsatAuditBudgetRangeRule(6.9, 1754.9),
      new TieredCsatAuditRequiredJourneyIdRule("tiered csat audit needs a value"),
      new TieredCsatAuditCeilingRangeRule(3.9, 2536.4),
      new TieredCsatAuditCodePrefixRule("X"),
    ],
  );
}
