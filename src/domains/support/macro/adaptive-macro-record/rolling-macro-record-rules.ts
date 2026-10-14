import { RollingMacroRecord } from "./rolling-macro-record.js";

/** A rule a rolling macro record must pass. Check returns its problems, or none. */
export interface RollingMacroRecordRule {
  check(item: RollingMacroRecord): string[];
}

export class RollingMacroRecordRequiredExternalRefRule implements RollingMacroRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingMacroRecord): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingMacroRecordCodePrefixRule implements RollingMacroRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingMacroRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingMacroRecordClicksRangeRule implements RollingMacroRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMacroRecord): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling macro record. */
export class RollingMacroRecordValidator {
  rules: RollingMacroRecordRule[];

  constructor(rules: RollingMacroRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RollingMacroRecord): string[] {
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

  requireValid(item: RollingMacroRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingMacroRecord[]): Map<string, string[]> {
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

export function defaultRollingMacroRecordValidator(): RollingMacroRecordValidator {
  return new RollingMacroRecordValidator(
    [
      new RollingMacroRecordRequiredExternalRefRule("rolling macro record needs a value"),
      new RollingMacroRecordCodePrefixRule("REF"),
      new RollingMacroRecordClicksRangeRule(255, 3600),
    ],
  );
}
