import * as text from "../../../../kit/text.js";
import { JourneyAudit } from "./journey-audit.js";

/** A rule a journey audit must pass. Check returns its problems, or none. */
export interface JourneyAuditRule {
  check(item: JourneyAudit): string[];
}

export class JourneyAuditSegmentLengthRule implements JourneyAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyAudit): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyAuditRetriesRangeRule implements JourneyAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyAudit): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyAuditCodePrefixRule implements JourneyAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyAuditRequiredSegmentRule implements JourneyAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyAuditRequiredNameRule implements JourneyAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyAuditAllowedSegmentRule implements JourneyAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is not allowed`];
    return [];
  }
}

/** Runs every rule of a journey audit. */
export class JourneyAuditValidator {
  rules: JourneyAuditRule[];

  constructor(rules: JourneyAuditRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyAudit): string[] {
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

  requireValid(item: JourneyAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyAudit[]): Map<string, string[]> {
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

export function defaultJourneyAuditValidator(): JourneyAuditValidator {
  return new JourneyAuditValidator(
    [
      new JourneyAuditSegmentLengthRule(64),
      new JourneyAuditRetriesRangeRule(80, 120),
      new JourneyAuditCodePrefixRule("X"),
      new JourneyAuditRequiredSegmentRule("journey audit needs an entry"),
      new JourneyAuditRequiredNameRule("journey audit needs an entry"),
      new JourneyAuditAllowedSegmentRule(["seasonal", "pending", "legacy"]),
    ],
  );
}
