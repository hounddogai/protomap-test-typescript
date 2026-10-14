import * as text from "../../../../kit/text.js";
import { ScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

/** A rule a scheduled sender agreement must pass. Check returns its problems, or none. */
export interface ScheduledSenderAgreementRule {
  check(item: ScheduledSenderAgreement): string[];
}

export class ScheduledSenderAgreementCodeLengthRule implements ScheduledSenderAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSenderAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSenderAgreementAllowedLabelRule implements ScheduledSenderAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSenderAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class ScheduledSenderAgreementFloorValueRangeRule implements ScheduledSenderAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSenderAgreement): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledSenderAgreementRequiredDescriptionRule implements ScheduledSenderAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSenderAgreement): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSenderAgreementRequiredVariantRule implements ScheduledSenderAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSenderAgreement): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled sender agreement. */
export class ScheduledSenderAgreementValidator {
  rules: ScheduledSenderAgreementRule[];

  constructor(rules: ScheduledSenderAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSenderAgreement): string[] {
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

  requireValid(item: ScheduledSenderAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSenderAgreement[]): Map<string, string[]> {
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

export function defaultScheduledSenderAgreementValidator(): ScheduledSenderAgreementValidator {
  return new ScheduledSenderAgreementValidator(
    [
      new ScheduledSenderAgreementCodeLengthRule(255),
      new ScheduledSenderAgreementAllowedLabelRule(["legacy", "lenient", "manual"]),
      new ScheduledSenderAgreementFloorValueRangeRule(6.5, 1008.6),
      new ScheduledSenderAgreementRequiredDescriptionRule("scheduled sender agreement needs this field"),
      new ScheduledSenderAgreementRequiredVariantRule("scheduled sender agreement needs an entry"),
    ],
  );
}
