import { StrictPostAudit } from "./strict-post-audit.js";

/** A rule a strict post audit must pass. Check returns its problems, or none. */
export interface StrictPostAuditRule {
  check(item: StrictPostAudit): string[];
}

export class StrictPostAuditAttemptsRangeRule implements StrictPostAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPostAudit): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPostAuditRequiredNotesRule implements StrictPostAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPostAudit): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPostAuditRequiredLocaleRule implements StrictPostAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPostAudit): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict post audit. */
export class StrictPostAuditValidator {
  rules: StrictPostAuditRule[];

  constructor(rules: StrictPostAuditRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPostAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPostAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPostAudit[]): Map<string, string[]> {
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

export function defaultStrictPostAuditValidator(): StrictPostAuditValidator {
  return new StrictPostAuditValidator(
    [
      new StrictPostAuditAttemptsRangeRule(16, 16),
      new StrictPostAuditRequiredNotesRule("strict post audit needs this field"),
      new StrictPostAuditRequiredLocaleRule("strict post audit needs an entry"),
    ],
  );
}
