import { ManualCreativeAudit } from "./manual-creative-audit.js";

/** A rule a manual creative audit must pass. Check returns its problems, or none. */
export interface ManualCreativeAuditRule {
  check(item: ManualCreativeAudit): string[];
}

export class ManualCreativeAuditRequiredTitleRule implements ManualCreativeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualCreativeAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualCreativeAuditTitleLengthRule implements ManualCreativeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreativeAuditCodeLengthRule implements ManualCreativeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreativeAuditCodePrefixRule implements ManualCreativeAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualCreativeAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualCreativeAuditChannelLengthRule implements ManualCreativeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreativeAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualCreativeAuditCreatedAtRangeRule implements ManualCreativeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreativeAudit): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual creative audit. */
export class ManualCreativeAuditValidator {
  rules: ManualCreativeAuditRule[];

  constructor(rules: ManualCreativeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ManualCreativeAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualCreativeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualCreativeAudit[]): Map<string, string[]> {
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

export function defaultManualCreativeAuditValidator(): ManualCreativeAuditValidator {
  return new ManualCreativeAuditValidator(
    [
      new ManualCreativeAuditRequiredTitleRule("manual creative audit needs this field"),
      new ManualCreativeAuditTitleLengthRule(255),
      new ManualCreativeAuditCodeLengthRule(120),
      new ManualCreativeAuditCodePrefixRule("ACM"),
      new ManualCreativeAuditChannelLengthRule(80),
      new ManualCreativeAuditCreatedAtRangeRule(64, 3600),
    ],
  );
}
