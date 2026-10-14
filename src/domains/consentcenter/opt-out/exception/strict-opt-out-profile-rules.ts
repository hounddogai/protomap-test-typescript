import * as text from "../../../../kit/text.js";
import { StrictOptOutProfile } from "./strict-opt-out-profile.js";

/** A rule a strict opt out profile must pass. Check returns its problems, or none. */
export interface StrictOptOutProfileRule {
  check(item: StrictOptOutProfile): string[];
}

export class StrictOptOutProfileAllowedNameRule implements StrictOptOutProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictOptOutProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class StrictOptOutProfileRequiredLocaleRule implements StrictOptOutProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictOptOutProfile): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class StrictOptOutProfileCodePrefixRule implements StrictOptOutProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictOptOutProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict opt out profile. */
export class StrictOptOutProfileValidator {
  rules: StrictOptOutProfileRule[];

  constructor(rules: StrictOptOutProfileRule[]) {
    this.rules = rules;
  }

  validate(item: StrictOptOutProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictOptOutProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictOptOutProfile[]): Map<string, string[]> {
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

export function defaultStrictOptOutProfileValidator(): StrictOptOutProfileValidator {
  return new StrictOptOutProfileValidator(
    [
      new StrictOptOutProfileAllowedNameRule([]),
      new StrictOptOutProfileRequiredLocaleRule("strict opt out profile needs this field"),
      new StrictOptOutProfileCodePrefixRule("REF"),
    ],
  );
}
