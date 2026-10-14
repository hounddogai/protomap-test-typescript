import { MentionAudit } from "./mention-audit.js";

/** A rule a mention audit must pass. Check returns its problems, or none. */
export interface MentionAuditRule {
  check(item: MentionAudit): string[];
}

export class MentionAuditCodeLengthRule implements MentionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionAuditLabelLengthRule implements MentionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionAuditPriorityRangeRule implements MentionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionAudit): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionAuditRequiredAudienceIdRule implements MentionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionAudit): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention audit. */
export class MentionAuditValidator {
  rules: MentionAuditRule[];

  constructor(rules: MentionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: MentionAudit): string[] {
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

  requireValid(item: MentionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionAudit[]): Map<string, string[]> {
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

export function defaultMentionAuditValidator(): MentionAuditValidator {
  return new MentionAuditValidator(
    [
      new MentionAuditCodeLengthRule(64),
      new MentionAuditLabelLengthRule(64),
      new MentionAuditPriorityRangeRule(80, 3600),
      new MentionAuditRequiredAudienceIdRule("mention audit needs an entry"),
    ],
  );
}
