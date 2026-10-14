import { RetentionAudit } from "./retention-audit.js";

/** A rule a retention audit must pass. Check returns its problems, or none. */
export interface RetentionAuditRule {
  check(item: RetentionAudit): string[];
}

export class RetentionAuditCodePrefixRule implements RetentionAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionAuditRequiredTitleRule implements RetentionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionAuditEndsAtRangeRule implements RetentionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAudit): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionAuditWindowDaysRangeRule implements RetentionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAudit): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionAuditMarginRangeRule implements RetentionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAudit): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a retention audit. */
export class RetentionAuditValidator {
  rules: RetentionAuditRule[];

  constructor(rules: RetentionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionAudit[]): Map<string, string[]> {
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

export function defaultRetentionAuditValidator(): RetentionAuditValidator {
  return new RetentionAuditValidator(
    [
      new RetentionAuditCodePrefixRule("ACM"),
      new RetentionAuditRequiredTitleRule("retention audit needs an entry"),
      new RetentionAuditEndsAtRangeRule(16, 80),
      new RetentionAuditWindowDaysRangeRule(80, 255),
      new RetentionAuditMarginRangeRule(0.4, 3655.9),
    ],
  );
}
