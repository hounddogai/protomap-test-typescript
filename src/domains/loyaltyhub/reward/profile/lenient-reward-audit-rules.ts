import { LenientRewardAudit } from "./lenient-reward-audit.js";

/** A rule a lenient reward audit must pass. Check returns its problems, or none. */
export interface LenientRewardAuditRule {
  check(item: LenientRewardAudit): string[];
}

export class LenientRewardAuditCodePrefixRule implements LenientRewardAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientRewardAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientRewardAuditRequiredCodeRule implements LenientRewardAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRewardAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRewardAuditCodeLengthRule implements LenientRewardAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardAuditCapacityRangeRule implements LenientRewardAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardAudit): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient reward audit. */
export class LenientRewardAuditValidator {
  rules: LenientRewardAuditRule[];

  constructor(rules: LenientRewardAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardAudit): string[] {
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

  requireValid(item: LenientRewardAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardAudit[]): Map<string, string[]> {
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

export function defaultLenientRewardAuditValidator(): LenientRewardAuditValidator {
  return new LenientRewardAuditValidator(
    [
      new LenientRewardAuditCodePrefixRule("OPS"),
      new LenientRewardAuditRequiredCodeRule("lenient reward audit needs this field"),
      new LenientRewardAuditCodeLengthRule(120),
      new LenientRewardAuditCapacityRangeRule(16, 120),
    ],
  );
}
