import * as text from "../../../../kit/text.js";
import { RollingFrequencyClaim } from "./rolling-frequency-claim.js";

/** A rule a rolling frequency claim must pass. Check returns its problems, or none. */
export interface RollingFrequencyClaimRule {
  check(item: RollingFrequencyClaim): string[];
}

export class RollingFrequencyClaimRequiredCodeRule implements RollingFrequencyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFrequencyClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFrequencyClaimAllowedCodeRule implements RollingFrequencyClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFrequencyClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class RollingFrequencyClaimRequiredDescriptionRule implements RollingFrequencyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFrequencyClaim): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling frequency claim. */
export class RollingFrequencyClaimValidator {
  rules: RollingFrequencyClaimRule[];

  constructor(rules: RollingFrequencyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFrequencyClaim): string[] {
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

  requireValid(item: RollingFrequencyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFrequencyClaim[]): Map<string, string[]> {
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

export function defaultRollingFrequencyClaimValidator(): RollingFrequencyClaimValidator {
  return new RollingFrequencyClaimValidator(
    [
      new RollingFrequencyClaimRequiredCodeRule("rolling frequency claim needs this field"),
      new RollingFrequencyClaimAllowedCodeRule(["manual"]),
      new RollingFrequencyClaimRequiredDescriptionRule("rolling frequency claim needs a value"),
    ],
  );
}
