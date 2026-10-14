import * as text from "../../../../kit/text.js";
import { PathAudit } from "./path-audit.js";

/** A rule a path audit must pass. Check returns its problems, or none. */
export interface PathAuditRule {
  check(item: PathAudit): string[];
}

export class PathAuditAllowedOwnerIdRule implements PathAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is unknown`];
    return [];
  }
}

export class PathAuditVersionRangeRule implements PathAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathAudit): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathAuditRequiredCodeRule implements PathAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathAuditRequiredOwnerIdRule implements PathAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathAudit): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PathAuditOwnerIdLengthRule implements PathAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathAudit): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathAuditTitleLengthRule implements PathAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path audit. */
export class PathAuditValidator {
  rules: PathAuditRule[];

  constructor(rules: PathAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PathAudit): string[] {
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

  requireValid(item: PathAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathAudit[]): Map<string, string[]> {
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

export function defaultPathAuditValidator(): PathAuditValidator {
  return new PathAuditValidator(
    [
      new PathAuditAllowedOwnerIdRule([]),
      new PathAuditVersionRangeRule(64, 255),
      new PathAuditRequiredCodeRule("path audit needs this field"),
      new PathAuditRequiredOwnerIdRule("path audit needs a value"),
      new PathAuditOwnerIdLengthRule(255),
      new PathAuditTitleLengthRule(86400),
    ],
  );
}
