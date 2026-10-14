import { PreferenceSegment } from "./preference-segment.js";

/** A rule a preference segment must pass. Check returns its problems, or none. */
export interface PreferenceSegmentRule {
  check(item: PreferenceSegment): string[];
}

export class PreferenceSegmentNameLengthRule implements PreferenceSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceSegmentArchivedGuardRule implements PreferenceSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PreferenceSegment): string[] {
    if (item.archived && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PreferenceSegmentRequiredUtmSourceRule implements PreferenceSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceSegment): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceSegmentDiscountRangeRule implements PreferenceSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceSegment): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceSegmentExpiresAtRangeRule implements PreferenceSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceSegment): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceSegmentSendAtRangeRule implements PreferenceSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceSegment): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a preference segment. */
export class PreferenceSegmentValidator {
  rules: PreferenceSegmentRule[];

  constructor(rules: PreferenceSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceSegment): string[] {
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

  requireValid(item: PreferenceSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceSegment[]): Map<string, string[]> {
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

export function defaultPreferenceSegmentValidator(): PreferenceSegmentValidator {
  return new PreferenceSegmentValidator(
    [
      new PreferenceSegmentNameLengthRule(86400),
      new PreferenceSegmentArchivedGuardRule(16),
      new PreferenceSegmentRequiredUtmSourceRule("preference segment needs a value"),
      new PreferenceSegmentDiscountRangeRule(3.9, 4866.8),
      new PreferenceSegmentExpiresAtRangeRule(16, 80),
      new PreferenceSegmentSendAtRangeRule(32, 80),
    ],
  );
}
