import * as text from "../../../../kit/text.js";
import { CappedEnrollmentCycle } from "./capped-enrollment-cycle.js";

/** A rule a capped enrollment cycle must pass. Check returns its problems, or none. */
export interface CappedEnrollmentCycleRule {
  check(item: CappedEnrollmentCycle): string[];
}

export class CappedEnrollmentCycleRequiredCodeRule implements CappedEnrollmentCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedEnrollmentCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedEnrollmentCycleAllowedNameRule implements CappedEnrollmentCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedEnrollmentCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class CappedEnrollmentCycleTimezoneLengthRule implements CappedEnrollmentCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentCycle): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedEnrollmentCycleRequiredNameRule implements CappedEnrollmentCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedEnrollmentCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped enrollment cycle. */
export class CappedEnrollmentCycleValidator {
  rules: CappedEnrollmentCycleRule[];

  constructor(rules: CappedEnrollmentCycleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedEnrollmentCycle): string[] {
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

  requireValid(item: CappedEnrollmentCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedEnrollmentCycle[]): Map<string, string[]> {
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

export function defaultCappedEnrollmentCycleValidator(): CappedEnrollmentCycleValidator {
  return new CappedEnrollmentCycleValidator(
    [
      new CappedEnrollmentCycleRequiredCodeRule("capped enrollment cycle needs this field"),
      new CappedEnrollmentCycleAllowedNameRule([]),
      new CappedEnrollmentCycleTimezoneLengthRule(3600),
      new CappedEnrollmentCycleRequiredNameRule("capped enrollment cycle needs this field"),
    ],
  );
}
