import { GlobalTouchpointAudit } from "./global-touchpoint-audit.js";

/** A rule a global touchpoint audit must pass. Check returns its problems, or none. */
export interface GlobalTouchpointAuditRule {
  check(item: GlobalTouchpointAudit): string[];
}

export class GlobalTouchpointAuditStartsAtRangeRule implements GlobalTouchpointAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalTouchpointAudit): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalTouchpointAuditBudgetRangeRule implements GlobalTouchpointAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalTouchpointAudit): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalTouchpointAuditCostRangeRule implements GlobalTouchpointAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalTouchpointAudit): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalTouchpointAuditExternalRefLengthRule implements GlobalTouchpointAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTouchpointAudit): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalTouchpointAuditJourneyIdLengthRule implements GlobalTouchpointAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTouchpointAudit): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalTouchpointAuditRequiredExternalRefRule implements GlobalTouchpointAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTouchpointAudit): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global touchpoint audit. */
export class GlobalTouchpointAuditValidator {
  rules: GlobalTouchpointAuditRule[];

  constructor(rules: GlobalTouchpointAuditRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalTouchpointAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalTouchpointAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalTouchpointAudit[]): Map<string, string[]> {
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

export function defaultGlobalTouchpointAuditValidator(): GlobalTouchpointAuditValidator {
  return new GlobalTouchpointAuditValidator(
    [
      new GlobalTouchpointAuditStartsAtRangeRule(32, 80),
      new GlobalTouchpointAuditBudgetRangeRule(4.4, 3975.2),
      new GlobalTouchpointAuditCostRangeRule(9, 1159.2),
      new GlobalTouchpointAuditExternalRefLengthRule(120),
      new GlobalTouchpointAuditJourneyIdLengthRule(255),
      new GlobalTouchpointAuditRequiredExternalRefRule("global touchpoint audit needs this field"),
    ],
  );
}
