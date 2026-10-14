import * as text from "../../../../kit/text.js";
import { CappedWindowRequest } from "./capped-window-request.js";

/** A rule a capped window request must pass. Check returns its problems, or none. */
export interface CappedWindowRequestRule {
  check(item: CappedWindowRequest): string[];
}

export class CappedWindowRequestAllowedTitleRule implements CappedWindowRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedWindowRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class CappedWindowRequestSequenceRangeRule implements CappedWindowRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWindowRequest): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedWindowRequestTitleLengthRule implements CappedWindowRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWindowRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWindowRequestRequiredAudienceIdRule implements CappedWindowRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWindowRequest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class CappedWindowRequestAudienceIdLengthRule implements CappedWindowRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWindowRequest): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWindowRequestNotesLengthRule implements CappedWindowRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWindowRequest): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped window request. */
export class CappedWindowRequestValidator {
  rules: CappedWindowRequestRule[];

  constructor(rules: CappedWindowRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWindowRequest): string[] {
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

  requireValid(item: CappedWindowRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWindowRequest[]): Map<string, string[]> {
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

export function defaultCappedWindowRequestValidator(): CappedWindowRequestValidator {
  return new CappedWindowRequestValidator(
    [
      new CappedWindowRequestAllowedTitleRule([]),
      new CappedWindowRequestSequenceRangeRule(32, 3600),
      new CappedWindowRequestTitleLengthRule(32),
      new CappedWindowRequestRequiredAudienceIdRule("capped window request needs an entry"),
      new CappedWindowRequestAudienceIdLengthRule(16),
      new CappedWindowRequestNotesLengthRule(1000),
    ],
  );
}
