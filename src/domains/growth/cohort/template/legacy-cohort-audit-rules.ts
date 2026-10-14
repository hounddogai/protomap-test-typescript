import { LegacyCohortAudit } from "./legacy-cohort-audit.js";

/** A rule a legacy cohort audit must pass. Check returns its problems, or none. */
export interface LegacyCohortAuditRule {
  check(item: LegacyCohortAudit): string[];
}

export class LegacyCohortAuditSequenceRangeRule implements LegacyCohortAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCohortAudit): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyCohortAuditActiveGuardRule implements LegacyCohortAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyCohortAudit): string[] {
    if (item.active && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LegacyCohortAuditRequiredCodeRule implements LegacyCohortAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCohortAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCohortAuditCodePrefixRule implements LegacyCohortAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyCohortAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyCohortAuditCodeLengthRule implements LegacyCohortAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCohortAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy cohort audit. */
export class LegacyCohortAuditValidator {
  rules: LegacyCohortAuditRule[];

  constructor(rules: LegacyCohortAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCohortAudit): string[] {
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

  requireValid(item: LegacyCohortAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCohortAudit[]): Map<string, string[]> {
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

export function defaultLegacyCohortAuditValidator(): LegacyCohortAuditValidator {
  return new LegacyCohortAuditValidator(
    [
      new LegacyCohortAuditSequenceRangeRule(64, 120),
      new LegacyCohortAuditActiveGuardRule(32),
      new LegacyCohortAuditRequiredCodeRule("legacy cohort audit needs a value"),
      new LegacyCohortAuditCodePrefixRule("OPS"),
      new LegacyCohortAuditCodeLengthRule(3600),
    ],
  );
}
