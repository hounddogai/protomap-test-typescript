import * as text from "../../../../kit/text.js";
import { TieredPacingWindow } from "./tiered-pacing-window.js";

/** A rule a tiered pacing window must pass. Check returns its problems, or none. */
export interface TieredPacingWindowRule {
  check(item: TieredPacingWindow): string[];
}

export class TieredPacingWindowRequiredPhoneRule implements TieredPacingWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPacingWindow): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPacingWindowAllowedPhoneRule implements TieredPacingWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPacingWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is out of range`];
    return [];
  }
}

export class TieredPacingWindowCodePrefixRule implements TieredPacingWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredPacingWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered pacing window. */
export class TieredPacingWindowValidator {
  rules: TieredPacingWindowRule[];

  constructor(rules: TieredPacingWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPacingWindow): string[] {
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

  requireValid(item: TieredPacingWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPacingWindow[]): Map<string, string[]> {
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

export function defaultTieredPacingWindowValidator(): TieredPacingWindowValidator {
  return new TieredPacingWindowValidator(
    [
      new TieredPacingWindowRequiredPhoneRule("tiered pacing window needs a value"),
      new TieredPacingWindowAllowedPhoneRule([]),
      new TieredPacingWindowCodePrefixRule("OPS"),
    ],
  );
}
