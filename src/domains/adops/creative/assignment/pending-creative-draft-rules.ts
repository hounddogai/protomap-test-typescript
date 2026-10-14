import { PendingCreativeDraft } from "./pending-creative-draft.js";

/** A rule a pending creative draft must pass. Check returns its problems, or none. */
export interface PendingCreativeDraftRule {
  check(item: PendingCreativeDraft): string[];
}

export class PendingCreativeDraftRequiredCodeRule implements PendingCreativeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCreativeDraftCodePrefixRule implements PendingCreativeDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingCreativeDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingCreativeDraftPhoneLengthRule implements PendingCreativeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreativeDraft): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCreativeDraftDurationMinutesRangeRule implements PendingCreativeDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCreativeDraft): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingCreativeDraftCohortLengthRule implements PendingCreativeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreativeDraft): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending creative draft. */
export class PendingCreativeDraftValidator {
  rules: PendingCreativeDraftRule[];

  constructor(rules: PendingCreativeDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCreativeDraft): string[] {
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

  requireValid(item: PendingCreativeDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCreativeDraft[]): Map<string, string[]> {
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

export function defaultPendingCreativeDraftValidator(): PendingCreativeDraftValidator {
  return new PendingCreativeDraftValidator(
    [
      new PendingCreativeDraftRequiredCodeRule("pending creative draft needs this field"),
      new PendingCreativeDraftCodePrefixRule("Q"),
      new PendingCreativeDraftPhoneLengthRule(80),
      new PendingCreativeDraftDurationMinutesRangeRule(32, 255),
      new PendingCreativeDraftCohortLengthRule(32),
    ],
  );
}
