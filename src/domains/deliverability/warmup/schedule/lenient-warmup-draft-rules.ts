import * as text from "../../../../kit/text.js";
import { LenientWarmupDraft } from "./lenient-warmup-draft.js";

/** A rule a lenient warmup draft must pass. Check returns its problems, or none. */
export interface LenientWarmupDraftRule {
  check(item: LenientWarmupDraft): string[];
}

export class LenientWarmupDraftRequiredUtmSourceRule implements LenientWarmupDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupDraft): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupDraftUtmSourceLengthRule implements LenientWarmupDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWarmupDraft): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWarmupDraftCodePrefixRule implements LenientWarmupDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientWarmupDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientWarmupDraftRequiredCodeRule implements LenientWarmupDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupDraftContactEmailLengthRule implements LenientWarmupDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWarmupDraft): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWarmupDraftAllowedContactEmailRule implements LenientWarmupDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWarmupDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is not allowed`];
    return [];
  }
}

/** Runs every rule of a lenient warmup draft. */
export class LenientWarmupDraftValidator {
  rules: LenientWarmupDraftRule[];

  constructor(rules: LenientWarmupDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWarmupDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientWarmupDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWarmupDraft[]): Map<string, string[]> {
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

export function defaultLenientWarmupDraftValidator(): LenientWarmupDraftValidator {
  return new LenientWarmupDraftValidator(
    [
      new LenientWarmupDraftRequiredUtmSourceRule("lenient warmup draft needs this field"),
      new LenientWarmupDraftUtmSourceLengthRule(1000),
      new LenientWarmupDraftCodePrefixRule("X"),
      new LenientWarmupDraftRequiredCodeRule("lenient warmup draft needs this field"),
      new LenientWarmupDraftContactEmailLengthRule(3600),
      new LenientWarmupDraftAllowedContactEmailRule(["global"]),
    ],
  );
}
