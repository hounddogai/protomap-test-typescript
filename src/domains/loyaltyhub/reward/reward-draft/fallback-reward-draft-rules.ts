import * as text from "../../../../kit/text.js";
import { FallbackRewardDraft } from "./fallback-reward-draft.js";

/** A rule a fallback reward draft must pass. Check returns its problems, or none. */
export interface FallbackRewardDraftRule {
  check(item: FallbackRewardDraft): string[];
}

export class FallbackRewardDraftRequiredLocaleRule implements FallbackRewardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardDraft): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardDraftRequiredSegmentRule implements FallbackRewardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardDraft): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardDraftRequiredNameRule implements FallbackRewardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardDraftAllowedCodeRule implements FallbackRewardDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackRewardDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class FallbackRewardDraftLocaleLengthRule implements FallbackRewardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardDraft): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRewardDraftNameLengthRule implements FallbackRewardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback reward draft. */
export class FallbackRewardDraftValidator {
  rules: FallbackRewardDraftRule[];

  constructor(rules: FallbackRewardDraftRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRewardDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardDraft[]): Map<string, string[]> {
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

export function defaultFallbackRewardDraftValidator(): FallbackRewardDraftValidator {
  return new FallbackRewardDraftValidator(
    [
      new FallbackRewardDraftRequiredLocaleRule("fallback reward draft needs a value"),
      new FallbackRewardDraftRequiredSegmentRule("fallback reward draft needs an entry"),
      new FallbackRewardDraftRequiredNameRule("fallback reward draft needs an entry"),
      new FallbackRewardDraftAllowedCodeRule(["primary", "seasonal"]),
      new FallbackRewardDraftLocaleLengthRule(80),
      new FallbackRewardDraftNameLengthRule(64),
    ],
  );
}
