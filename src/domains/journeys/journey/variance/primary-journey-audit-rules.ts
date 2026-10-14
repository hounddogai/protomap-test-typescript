import { PrimaryJourneyAudit } from "./primary-journey-audit.js";

/** A rule a primary journey audit must pass. Check returns its problems, or none. */
export interface PrimaryJourneyAuditRule {
  check(item: PrimaryJourneyAudit): string[];
}

export class PrimaryJourneyAuditRequiredCodeRule implements PrimaryJourneyAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryJourneyAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryJourneyAuditEndsAtRangeRule implements PrimaryJourneyAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryJourneyAudit): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryJourneyAuditSendAtRangeRule implements PrimaryJourneyAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryJourneyAudit): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryJourneyAuditCodePrefixRule implements PrimaryJourneyAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryJourneyAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryJourneyAuditRequiredCurrencyRule implements PrimaryJourneyAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryJourneyAudit): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary journey audit. */
export class PrimaryJourneyAuditValidator {
  rules: PrimaryJourneyAuditRule[];

  constructor(rules: PrimaryJourneyAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryJourneyAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryJourneyAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryJourneyAudit[]): Map<string, string[]> {
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

export function defaultPrimaryJourneyAuditValidator(): PrimaryJourneyAuditValidator {
  return new PrimaryJourneyAuditValidator(
    [
      new PrimaryJourneyAuditRequiredCodeRule("primary journey audit needs a value"),
      new PrimaryJourneyAuditEndsAtRangeRule(64, 86400),
      new PrimaryJourneyAuditSendAtRangeRule(120, 1000),
      new PrimaryJourneyAuditCodePrefixRule("OPS"),
      new PrimaryJourneyAuditRequiredCurrencyRule("primary journey audit needs an entry"),
    ],
  );
}
