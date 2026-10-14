import { BadgeAudit } from "./badge-audit.js";

/** A rule a badge audit must pass. Check returns its problems, or none. */
export interface BadgeAuditRule {
  check(item: BadgeAudit): string[];
}

export class BadgeAuditExpiresAtRangeRule implements BadgeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeAudit): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeAuditCampaignRefLengthRule implements BadgeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeAudit): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeAuditRequiredNameRule implements BadgeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeAuditRequiredCodeRule implements BadgeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeAuditMinimumRangeRule implements BadgeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeAudit): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a badge audit. */
export class BadgeAuditValidator {
  rules: BadgeAuditRule[];

  constructor(rules: BadgeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeAudit[]): Map<string, string[]> {
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

export function defaultBadgeAuditValidator(): BadgeAuditValidator {
  return new BadgeAuditValidator(
    [
      new BadgeAuditExpiresAtRangeRule(16, 86400),
      new BadgeAuditCampaignRefLengthRule(120),
      new BadgeAuditRequiredNameRule("badge audit needs this field"),
      new BadgeAuditRequiredCodeRule("badge audit needs this field"),
      new BadgeAuditMinimumRangeRule(1.9, 4479),
    ],
  );
}
