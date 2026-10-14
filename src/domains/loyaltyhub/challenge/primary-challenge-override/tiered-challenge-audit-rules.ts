import { TieredChallengeAudit } from "./tiered-challenge-audit.js";

/** A rule a tiered challenge audit must pass. Check returns its problems, or none. */
export interface TieredChallengeAuditRule {
  check(item: TieredChallengeAudit): string[];
}

export class TieredChallengeAuditLabelLengthRule implements TieredChallengeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredChallengeAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredChallengeAuditRequiredChannelRule implements TieredChallengeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredChallengeAudit): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TieredChallengeAuditCodePrefixRule implements TieredChallengeAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredChallengeAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredChallengeAuditRequiredLabelRule implements TieredChallengeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredChallengeAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredChallengeAuditClicksRangeRule implements TieredChallengeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredChallengeAudit): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered challenge audit. */
export class TieredChallengeAuditValidator {
  rules: TieredChallengeAuditRule[];

  constructor(rules: TieredChallengeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TieredChallengeAudit): string[] {
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

  requireValid(item: TieredChallengeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredChallengeAudit[]): Map<string, string[]> {
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

export function defaultTieredChallengeAuditValidator(): TieredChallengeAuditValidator {
  return new TieredChallengeAuditValidator(
    [
      new TieredChallengeAuditLabelLengthRule(255),
      new TieredChallengeAuditRequiredChannelRule("tiered challenge audit needs this field"),
      new TieredChallengeAuditCodePrefixRule("ACM"),
      new TieredChallengeAuditRequiredLabelRule("tiered challenge audit needs an entry"),
      new TieredChallengeAuditClicksRangeRule(120, 255),
    ],
  );
}
