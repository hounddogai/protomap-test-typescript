import * as text from "../../../../kit/text.js";
import { FallbackCsatDraft } from "./fallback-csat-draft.js";

/** A rule a fallback csat draft must pass. Check returns its problems, or none. */
export interface FallbackCsatDraftRule {
  check(item: FallbackCsatDraft): string[];
}

export class FallbackCsatDraftSendAtRangeRule implements FallbackCsatDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCsatDraft): string[] {
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

export class FallbackCsatDraftAllowedCodeRule implements FallbackCsatDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackCsatDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class FallbackCsatDraftRequiredNameRule implements FallbackCsatDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCsatDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCsatDraftCapacityRangeRule implements FallbackCsatDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCsatDraft): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackCsatDraftCodeLengthRule implements FallbackCsatDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCsatDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback csat draft. */
export class FallbackCsatDraftValidator {
  rules: FallbackCsatDraftRule[];

  constructor(rules: FallbackCsatDraftRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCsatDraft): string[] {
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

  requireValid(item: FallbackCsatDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCsatDraft[]): Map<string, string[]> {
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

export function defaultFallbackCsatDraftValidator(): FallbackCsatDraftValidator {
  return new FallbackCsatDraftValidator(
    [
      new FallbackCsatDraftSendAtRangeRule(64, 80),
      new FallbackCsatDraftAllowedCodeRule(["seasonal", "weighted"]),
      new FallbackCsatDraftRequiredNameRule("fallback csat draft needs this field"),
      new FallbackCsatDraftCapacityRangeRule(64, 1000),
      new FallbackCsatDraftCodeLengthRule(255),
    ],
  );
}
