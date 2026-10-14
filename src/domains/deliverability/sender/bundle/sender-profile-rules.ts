import * as text from "../../../../kit/text.js";
import { SenderProfile } from "./sender-profile.js";

/** A rule a sender profile must pass. Check returns its problems, or none. */
export interface SenderProfileRule {
  check(item: SenderProfile): string[];
}

export class SenderProfileVersionRangeRule implements SenderProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderProfile): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderProfileSegmentLengthRule implements SenderProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderProfile): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderProfileAllowedCodeRule implements SenderProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class SenderProfileAudienceIdLengthRule implements SenderProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderProfile): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sender profile. */
export class SenderProfileValidator {
  rules: SenderProfileRule[];

  constructor(rules: SenderProfileRule[]) {
    this.rules = rules;
  }

  validate(item: SenderProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderProfile[]): Map<string, string[]> {
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

export function defaultSenderProfileValidator(): SenderProfileValidator {
  return new SenderProfileValidator(
    [
      new SenderProfileVersionRangeRule(16, 255),
      new SenderProfileSegmentLengthRule(3600),
      new SenderProfileAllowedCodeRule(["fallback", "fallback"]),
      new SenderProfileAudienceIdLengthRule(86400),
    ],
  );
}
