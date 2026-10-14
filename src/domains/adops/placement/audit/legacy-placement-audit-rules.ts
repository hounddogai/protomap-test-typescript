import { LegacyPlacementAudit } from "./legacy-placement-audit.js";

/** A rule a legacy placement audit must pass. Check returns its problems, or none. */
export interface LegacyPlacementAuditRule {
  check(item: LegacyPlacementAudit): string[];
}

export class LegacyPlacementAuditRequiredJourneyIdRule implements LegacyPlacementAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPlacementAudit): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPlacementAuditCodePrefixRule implements LegacyPlacementAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyPlacementAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyPlacementAuditRequiredCodeRule implements LegacyPlacementAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPlacementAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPlacementAuditQuantityRangeRule implements LegacyPlacementAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPlacementAudit): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy placement audit. */
export class LegacyPlacementAuditValidator {
  rules: LegacyPlacementAuditRule[];

  constructor(rules: LegacyPlacementAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPlacementAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPlacementAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPlacementAudit[]): Map<string, string[]> {
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

export function defaultLegacyPlacementAuditValidator(): LegacyPlacementAuditValidator {
  return new LegacyPlacementAuditValidator(
    [
      new LegacyPlacementAuditRequiredJourneyIdRule("legacy placement audit needs an entry"),
      new LegacyPlacementAuditCodePrefixRule("X"),
      new LegacyPlacementAuditRequiredCodeRule("legacy placement audit needs a value"),
      new LegacyPlacementAuditQuantityRangeRule(32, 32),
    ],
  );
}
