import { ProofSchedule } from "./proof-schedule.js";

/** A rule a proof schedule must pass. Check returns its problems, or none. */
export interface ProofScheduleRule {
  check(item: ProofSchedule): string[];
}

export class ProofScheduleLocaleLengthRule implements ProofScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofSchedule): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofScheduleLabelLengthRule implements ProofScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofScheduleRequiredLocaleRule implements ProofScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofSchedule): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ProofScheduleRequiredTitleRule implements ProofScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof schedule. */
export class ProofScheduleValidator {
  rules: ProofScheduleRule[];

  constructor(rules: ProofScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ProofSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofSchedule[]): Map<string, string[]> {
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

export function defaultProofScheduleValidator(): ProofScheduleValidator {
  return new ProofScheduleValidator(
    [
      new ProofScheduleLocaleLengthRule(32),
      new ProofScheduleLabelLengthRule(16),
      new ProofScheduleRequiredLocaleRule("proof schedule needs an entry"),
      new ProofScheduleRequiredTitleRule("proof schedule needs this field"),
    ],
  );
}
