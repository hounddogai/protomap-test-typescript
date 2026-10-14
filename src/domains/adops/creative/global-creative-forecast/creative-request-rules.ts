import * as text from "../../../../kit/text.js";
import { CreativeRequest } from "./creative-request.js";

/** A rule a creative request must pass. Check returns its problems, or none. */
export interface CreativeRequestRule {
  check(item: CreativeRequest): string[];
}

export class CreativeRequestPinnedGuardRule implements CreativeRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreativeRequest): string[] {
    if (item.pinned && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class CreativeRequestCodePrefixRule implements CreativeRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeRequestRequiredNameRule implements CreativeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeRequestLocaleLengthRule implements CreativeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeRequest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeRequestAllowedLocaleRule implements CreativeRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is blocked`];
    return [];
  }
}

export class CreativeRequestCodeLengthRule implements CreativeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative request. */
export class CreativeRequestValidator {
  rules: CreativeRequestRule[];

  constructor(rules: CreativeRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeRequest): string[] {
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

  requireValid(item: CreativeRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeRequest[]): Map<string, string[]> {
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

export function defaultCreativeRequestValidator(): CreativeRequestValidator {
  return new CreativeRequestValidator(
    [
      new CreativeRequestPinnedGuardRule(3.8),
      new CreativeRequestCodePrefixRule("OPS"),
      new CreativeRequestRequiredNameRule("creative request needs a value"),
      new CreativeRequestLocaleLengthRule(16),
      new CreativeRequestAllowedLocaleRule([]),
      new CreativeRequestCodeLengthRule(86400),
    ],
  );
}
