import * as text from "../../../../kit/text.js";
import { ConversionWindow } from "./conversion-window.js";

/** A rule a conversion window must pass. Check returns its problems, or none. */
export interface ConversionWindowRule {
  check(item: ConversionWindow): string[];
}

export class ConversionWindowRequiredLabelRule implements ConversionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionWindowAllowedCodeRule implements ConversionWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class ConversionWindowPinnedGuardRule implements ConversionWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ConversionWindow): string[] {
    if (item.pinned && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class ConversionWindowRequiredCodeRule implements ConversionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionWindowLabelLengthRule implements ConversionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion window. */
export class ConversionWindowValidator {
  rules: ConversionWindowRule[];

  constructor(rules: ConversionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionWindow): string[] {
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

  requireValid(item: ConversionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionWindow[]): Map<string, string[]> {
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

export function defaultConversionWindowValidator(): ConversionWindowValidator {
  return new ConversionWindowValidator(
    [
      new ConversionWindowRequiredLabelRule("conversion window needs an entry"),
      new ConversionWindowAllowedCodeRule(["adaptive", "weighted", "default"]),
      new ConversionWindowPinnedGuardRule(80),
      new ConversionWindowRequiredCodeRule("conversion window needs a value"),
      new ConversionWindowLabelLengthRule(255),
    ],
  );
}
