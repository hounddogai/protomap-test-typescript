import { ApprovalSchedule } from "./approval-schedule.js";

/** A rule a approval schedule must pass. Check returns its problems, or none. */
export interface ApprovalScheduleRule {
  check(item: ApprovalSchedule): string[];
}

export class ApprovalScheduleDescriptionLengthRule implements ApprovalScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSchedule): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalScheduleNameLengthRule implements ApprovalScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalScheduleCodePrefixRule implements ApprovalScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalScheduleRequiredNameRule implements ApprovalScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalScheduleScoreRangeRule implements ApprovalScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalSchedule): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalScheduleCodeLengthRule implements ApprovalScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval schedule. */
export class ApprovalScheduleValidator {
  rules: ApprovalScheduleRule[];

  constructor(rules: ApprovalScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalSchedule): string[] {
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

  requireValid(item: ApprovalSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalSchedule[]): Map<string, string[]> {
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

export function defaultApprovalScheduleValidator(): ApprovalScheduleValidator {
  return new ApprovalScheduleValidator(
    [
      new ApprovalScheduleDescriptionLengthRule(3600),
      new ApprovalScheduleNameLengthRule(120),
      new ApprovalScheduleCodePrefixRule("REF"),
      new ApprovalScheduleRequiredNameRule("approval schedule needs an entry"),
      new ApprovalScheduleScoreRangeRule(8.2, 1240),
      new ApprovalScheduleCodeLengthRule(16),
    ],
  );
}
