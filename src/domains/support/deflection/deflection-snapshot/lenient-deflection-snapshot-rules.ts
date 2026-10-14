import * as text from "../../../../kit/text.js";
import { LenientDeflectionSnapshot } from "./lenient-deflection-snapshot.js";

/** A rule a lenient deflection snapshot must pass. Check returns its problems, or none. */
export interface LenientDeflectionSnapshotRule {
  check(item: LenientDeflectionSnapshot): string[];
}

export class LenientDeflectionSnapshotAllowedLabelRule implements LenientDeflectionSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientDeflectionSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class LenientDeflectionSnapshotRequiredChannelRule implements LenientDeflectionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDeflectionSnapshot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDeflectionSnapshotSendAtRangeRule implements LenientDeflectionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientDeflectionSnapshot): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientDeflectionSnapshotJourneyIdLengthRule implements LenientDeflectionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionSnapshot): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient deflection snapshot. */
export class LenientDeflectionSnapshotValidator {
  rules: LenientDeflectionSnapshotRule[];

  constructor(rules: LenientDeflectionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDeflectionSnapshot): string[] {
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

  requireValid(item: LenientDeflectionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDeflectionSnapshot[]): Map<string, string[]> {
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

export function defaultLenientDeflectionSnapshotValidator(): LenientDeflectionSnapshotValidator {
  return new LenientDeflectionSnapshotValidator(
    [
      new LenientDeflectionSnapshotAllowedLabelRule(["batched"]),
      new LenientDeflectionSnapshotRequiredChannelRule("lenient deflection snapshot needs an entry"),
      new LenientDeflectionSnapshotSendAtRangeRule(32, 255),
      new LenientDeflectionSnapshotJourneyIdLengthRule(86400),
    ],
  );
}
