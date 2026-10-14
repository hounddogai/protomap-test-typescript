import * as text from "../../../../kit/text.js";
import { ScheduledProofAgreement } from "./scheduled-proof-agreement.js";

/** A rule a scheduled proof agreement must pass. Check returns its problems, or none. */
export interface ScheduledProofAgreementRule {
  check(item: ScheduledProofAgreement): string[];
}

export class ScheduledProofAgreementAllowedLabelRule implements ScheduledProofAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledProofAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class ScheduledProofAgreementRequiredCodeRule implements ScheduledProofAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledProofAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledProofAgreementRequiredNotesRule implements ScheduledProofAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledProofAgreement): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledProofAgreementChecksumLengthRule implements ScheduledProofAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledProofAgreement): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledProofAgreementFloorValueRangeRule implements ScheduledProofAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledProofAgreement): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled proof agreement. */
export class ScheduledProofAgreementValidator {
  rules: ScheduledProofAgreementRule[];

  constructor(rules: ScheduledProofAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledProofAgreement): string[] {
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

  requireValid(item: ScheduledProofAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledProofAgreement[]): Map<string, string[]> {
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

export function defaultScheduledProofAgreementValidator(): ScheduledProofAgreementValidator {
  return new ScheduledProofAgreementValidator(
    [
      new ScheduledProofAgreementAllowedLabelRule(["global", "default", "global"]),
      new ScheduledProofAgreementRequiredCodeRule("scheduled proof agreement needs this field"),
      new ScheduledProofAgreementRequiredNotesRule("scheduled proof agreement needs a value"),
      new ScheduledProofAgreementChecksumLengthRule(64),
      new ScheduledProofAgreementFloorValueRangeRule(3.3, 1944.8),
    ],
  );
}
