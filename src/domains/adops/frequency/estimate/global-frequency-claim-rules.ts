import { GlobalFrequencyClaim } from "./global-frequency-claim.js";

/** A rule a global frequency claim must pass. Check returns its problems, or none. */
export interface GlobalFrequencyClaimRule {
  check(item: GlobalFrequencyClaim): string[];
}

export class GlobalFrequencyClaimRequiredLabelRule implements GlobalFrequencyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFrequencyClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFrequencyClaimLabelLengthRule implements GlobalFrequencyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFrequencyClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFrequencyClaimFrequencyCapRangeRule implements GlobalFrequencyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFrequencyClaim): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFrequencyClaimCodeLengthRule implements GlobalFrequencyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFrequencyClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFrequencyClaimPinnedGuardRule implements GlobalFrequencyClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalFrequencyClaim): string[] {
    if (item.pinned && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a global frequency claim. */
export class GlobalFrequencyClaimValidator {
  rules: GlobalFrequencyClaimRule[];

  constructor(rules: GlobalFrequencyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFrequencyClaim): string[] {
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

  requireValid(item: GlobalFrequencyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFrequencyClaim[]): Map<string, string[]> {
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

export function defaultGlobalFrequencyClaimValidator(): GlobalFrequencyClaimValidator {
  return new GlobalFrequencyClaimValidator(
    [
      new GlobalFrequencyClaimRequiredLabelRule("global frequency claim needs a value"),
      new GlobalFrequencyClaimLabelLengthRule(32),
      new GlobalFrequencyClaimFrequencyCapRangeRule(80, 86400),
      new GlobalFrequencyClaimCodeLengthRule(86400),
      new GlobalFrequencyClaimPinnedGuardRule(120),
    ],
  );
}
