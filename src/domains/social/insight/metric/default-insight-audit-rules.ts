import { DefaultInsightAudit } from "./default-insight-audit.js";

/** A rule a default insight audit must pass. Check returns its problems, or none. */
export interface DefaultInsightAuditRule {
  check(item: DefaultInsightAudit): string[];
}

export class DefaultInsightAuditChannelLengthRule implements DefaultInsightAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInsightAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultInsightAuditRequiredChannelRule implements DefaultInsightAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInsightAudit): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultInsightAuditCohortLengthRule implements DefaultInsightAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInsightAudit): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default insight audit. */
export class DefaultInsightAuditValidator {
  rules: DefaultInsightAuditRule[];

  constructor(rules: DefaultInsightAuditRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInsightAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultInsightAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInsightAudit[]): Map<string, string[]> {
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

export function defaultDefaultInsightAuditValidator(): DefaultInsightAuditValidator {
  return new DefaultInsightAuditValidator(
    [
      new DefaultInsightAuditChannelLengthRule(32),
      new DefaultInsightAuditRequiredChannelRule("default insight audit needs this field"),
      new DefaultInsightAuditCohortLengthRule(64),
    ],
  );
}
