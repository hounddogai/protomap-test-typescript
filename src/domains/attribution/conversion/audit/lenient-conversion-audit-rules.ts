import { LenientConversionAudit } from "./lenient-conversion-audit.js";

/** A rule a lenient conversion audit must pass. Check returns its problems, or none. */
export interface LenientConversionAuditRule {
  check(item: LenientConversionAudit): string[];
}

export class LenientConversionAuditCodePrefixRule implements LenientConversionAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientConversionAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientConversionAuditStartsAtRangeRule implements LenientConversionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientConversionAudit): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientConversionAuditRequiredSegmentRule implements LenientConversionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientConversionAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class LenientConversionAuditCodeLengthRule implements LenientConversionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientConversionAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientConversionAuditRequiredNameRule implements LenientConversionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientConversionAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient conversion audit. */
export class LenientConversionAuditValidator {
  rules: LenientConversionAuditRule[];

  constructor(rules: LenientConversionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LenientConversionAudit): string[] {
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

  requireValid(item: LenientConversionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientConversionAudit[]): Map<string, string[]> {
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

export function defaultLenientConversionAuditValidator(): LenientConversionAuditValidator {
  return new LenientConversionAuditValidator(
    [
      new LenientConversionAuditCodePrefixRule("Q"),
      new LenientConversionAuditStartsAtRangeRule(16, 1000),
      new LenientConversionAuditRequiredSegmentRule("lenient conversion audit needs an entry"),
      new LenientConversionAuditCodeLengthRule(255),
      new LenientConversionAuditRequiredNameRule("lenient conversion audit needs an entry"),
    ],
  );
}
