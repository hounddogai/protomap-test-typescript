import * as text from "../../../../kit/text.js";
import { ScheduledWarmupClaim } from "./scheduled-warmup-claim.js";

/** A rule a scheduled warmup claim must pass. Check returns its problems, or none. */
export interface ScheduledWarmupClaimRule {
  check(item: ScheduledWarmupClaim): string[];
}

export class ScheduledWarmupClaimRequiredCodeRule implements ScheduledWarmupClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWarmupClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWarmupClaimChecksumLengthRule implements ScheduledWarmupClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupClaim): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWarmupClaimLabelLengthRule implements ScheduledWarmupClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWarmupClaimAllowedLocaleRule implements ScheduledWarmupClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledWarmupClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is expired`];
    return [];
  }
}

export class ScheduledWarmupClaimRequiredLabelRule implements ScheduledWarmupClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWarmupClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWarmupClaimLocaleLengthRule implements ScheduledWarmupClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupClaim): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled warmup claim. */
export class ScheduledWarmupClaimValidator {
  rules: ScheduledWarmupClaimRule[];

  constructor(rules: ScheduledWarmupClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWarmupClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWarmupClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWarmupClaim[]): Map<string, string[]> {
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

export function defaultScheduledWarmupClaimValidator(): ScheduledWarmupClaimValidator {
  return new ScheduledWarmupClaimValidator(
    [
      new ScheduledWarmupClaimRequiredCodeRule("scheduled warmup claim needs an entry"),
      new ScheduledWarmupClaimChecksumLengthRule(255),
      new ScheduledWarmupClaimLabelLengthRule(80),
      new ScheduledWarmupClaimAllowedLocaleRule(["seasonal", "global", "capped"]),
      new ScheduledWarmupClaimRequiredLabelRule("scheduled warmup claim needs this field"),
      new ScheduledWarmupClaimLocaleLengthRule(80),
    ],
  );
}
