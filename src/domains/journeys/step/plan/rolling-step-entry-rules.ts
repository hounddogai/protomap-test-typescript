import * as text from "../../../../kit/text.js";
import { RollingStepEntry } from "./rolling-step-entry.js";

/** A rule a rolling step entry must pass. Check returns its problems, or none. */
export interface RollingStepEntryRule {
  check(item: RollingStepEntry): string[];
}

export class RollingStepEntryAllowedNameRule implements RollingStepEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingStepEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class RollingStepEntryRequiredTimezoneRule implements RollingStepEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepEntry): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepEntryNameLengthRule implements RollingStepEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingStepEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling step entry. */
export class RollingStepEntryValidator {
  rules: RollingStepEntryRule[];

  constructor(rules: RollingStepEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStepEntry): string[] {
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

  requireValid(item: RollingStepEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStepEntry[]): Map<string, string[]> {
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

export function defaultRollingStepEntryValidator(): RollingStepEntryValidator {
  return new RollingStepEntryValidator(
    [
      new RollingStepEntryAllowedNameRule([]),
      new RollingStepEntryRequiredTimezoneRule("rolling step entry needs this field"),
      new RollingStepEntryNameLengthRule(86400),
    ],
  );
}
