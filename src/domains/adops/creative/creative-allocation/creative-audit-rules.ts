import { CreativeAudit } from "./creative-audit.js";

/** A rule a creative audit must pass. Check returns its problems, or none. */
export interface CreativeAuditRule {
  check(item: CreativeAudit): string[];
}

export class CreativeAuditVisibleGuardRule implements CreativeAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreativeAudit): string[] {
    if (item.visible && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CreativeAuditCodeLengthRule implements CreativeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeAuditWindowDaysRangeRule implements CreativeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeAudit): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a creative audit. */
export class CreativeAuditValidator {
  rules: CreativeAuditRule[];

  constructor(rules: CreativeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeAudit[]): Map<string, string[]> {
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

export function defaultCreativeAuditValidator(): CreativeAuditValidator {
  return new CreativeAuditValidator(
    [
      new CreativeAuditVisibleGuardRule(3600),
      new CreativeAuditCodeLengthRule(80),
      new CreativeAuditWindowDaysRangeRule(1000, 86400),
    ],
  );
}
