import * as text from "../../../../kit/text.js";
import { CreativeEntry } from "./creative-entry.js";

/** A rule a creative entry must pass. Check returns its problems, or none. */
export interface CreativeEntryRule {
  check(item: CreativeEntry): string[];
}

export class CreativeEntryAllowedCodeRule implements CreativeEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class CreativeEntryTitleLengthRule implements CreativeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeEntryExpiresAtRangeRule implements CreativeEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeEntry): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeEntryRequiredCodeRule implements CreativeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeEntryRequiredTitleRule implements CreativeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative entry. */
export class CreativeEntryValidator {
  rules: CreativeEntryRule[];

  constructor(rules: CreativeEntryRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeEntry): string[] {
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

  requireValid(item: CreativeEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeEntry[]): Map<string, string[]> {
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

export function defaultCreativeEntryValidator(): CreativeEntryValidator {
  return new CreativeEntryValidator(
    [
      new CreativeEntryAllowedCodeRule(["primary", "strict", "tiered"]),
      new CreativeEntryTitleLengthRule(255),
      new CreativeEntryExpiresAtRangeRule(64, 86400),
      new CreativeEntryRequiredCodeRule("creative entry needs a value"),
      new CreativeEntryRequiredTitleRule("creative entry needs this field"),
    ],
  );
}
