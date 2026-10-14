import * as text from "../../../../kit/text.js";
import { QueueAudit } from "./queue-audit.js";

/** A rule a queue audit must pass. Check returns its problems, or none. */
export interface QueueAuditRule {
  check(item: QueueAudit): string[];
}

export class QueueAuditVersionRangeRule implements QueueAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueAudit): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueAuditAllowedExternalRefRule implements QueueAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is below minimum`];
    return [];
  }
}

export class QueueAuditRequiredCodeRule implements QueueAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueAuditRegionLengthRule implements QueueAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueAudit): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue audit. */
export class QueueAuditValidator {
  rules: QueueAuditRule[];

  constructor(rules: QueueAuditRule[]) {
    this.rules = rules;
  }

  validate(item: QueueAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueAudit[]): Map<string, string[]> {
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

export function defaultQueueAuditValidator(): QueueAuditValidator {
  return new QueueAuditValidator(
    [
      new QueueAuditVersionRangeRule(32, 80),
      new QueueAuditAllowedExternalRefRule(["regional"]),
      new QueueAuditRequiredCodeRule("queue audit needs an entry"),
      new QueueAuditRegionLengthRule(3600),
    ],
  );
}
