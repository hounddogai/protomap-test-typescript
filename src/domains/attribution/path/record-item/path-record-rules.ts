import { PathRecord } from "./path-record.js";

/** A rule a path record must pass. Check returns its problems, or none. */
export interface PathRecordRule {
  check(item: PathRecord): string[];
}

export class PathRecordRequiredReviewerRule implements PathRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathRecord): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PathRecordRequiredNameRule implements PathRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PathRecordRequiredPhoneRule implements PathRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathRecord): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PathRecordNameLengthRule implements PathRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathRecordRequiredCodeRule implements PathRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathRecordCodeLengthRule implements PathRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path record. */
export class PathRecordValidator {
  rules: PathRecordRule[];

  constructor(rules: PathRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PathRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathRecord[]): Map<string, string[]> {
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

export function defaultPathRecordValidator(): PathRecordValidator {
  return new PathRecordValidator(
    [
      new PathRecordRequiredReviewerRule("path record needs an entry"),
      new PathRecordRequiredNameRule("path record needs this field"),
      new PathRecordRequiredPhoneRule("path record needs a value"),
      new PathRecordNameLengthRule(86400),
      new PathRecordRequiredCodeRule("path record needs an entry"),
      new PathRecordCodeLengthRule(32),
    ],
  );
}
