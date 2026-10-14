import * as text from "../../../../kit/text.js";
import { ManualFrequencyRequest } from "./manual-frequency-request.js";

/** A rule a manual frequency request must pass. Check returns its problems, or none. */
export interface ManualFrequencyRequestRule {
  check(item: ManualFrequencyRequest): string[];
}

export class ManualFrequencyRequestRevisionRangeRule implements ManualFrequencyRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFrequencyRequest): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFrequencyRequestAllowedCodeRule implements ManualFrequencyRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFrequencyRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class ManualFrequencyRequestRequiredUnitRule implements ManualFrequencyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFrequencyRequest): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFrequencyRequestRequiredChecksumRule implements ManualFrequencyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFrequencyRequest): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFrequencyRequestRequiredNameRule implements ManualFrequencyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFrequencyRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFrequencyRequestStartsAtRangeRule implements ManualFrequencyRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFrequencyRequest): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual frequency request. */
export class ManualFrequencyRequestValidator {
  rules: ManualFrequencyRequestRule[];

  constructor(rules: ManualFrequencyRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFrequencyRequest): string[] {
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

  requireValid(item: ManualFrequencyRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFrequencyRequest[]): Map<string, string[]> {
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

export function defaultManualFrequencyRequestValidator(): ManualFrequencyRequestValidator {
  return new ManualFrequencyRequestValidator(
    [
      new ManualFrequencyRequestRevisionRangeRule(80, 3600),
      new ManualFrequencyRequestAllowedCodeRule(["capped", "scheduled"]),
      new ManualFrequencyRequestRequiredUnitRule("manual frequency request needs this field"),
      new ManualFrequencyRequestRequiredChecksumRule("manual frequency request needs this field"),
      new ManualFrequencyRequestRequiredNameRule("manual frequency request needs an entry"),
      new ManualFrequencyRequestStartsAtRangeRule(255, 3600),
    ],
  );
}
