import * as text from "../../../../kit/text.js";
import { LegacyChallengeAudit } from "./legacy-challenge-audit.js";

/** A rule a legacy challenge audit must pass. Check returns its problems, or none. */
export interface LegacyChallengeAuditRule {
  check(item: LegacyChallengeAudit): string[];
}

export class LegacyChallengeAuditWindowDaysRangeRule implements LegacyChallengeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeAudit): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyChallengeAuditNameLengthRule implements LegacyChallengeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyChallengeAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyChallengeAuditAllowedRegionRule implements LegacyChallengeAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyChallengeAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is not allowed`];
    return [];
  }
}

export class LegacyChallengeAuditRequiredCodeRule implements LegacyChallengeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyChallengeAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyChallengeAuditExpiresAtRangeRule implements LegacyChallengeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeAudit): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyChallengeAuditCodePrefixRule implements LegacyChallengeAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyChallengeAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy challenge audit. */
export class LegacyChallengeAuditValidator {
  rules: LegacyChallengeAuditRule[];

  constructor(rules: LegacyChallengeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyChallengeAudit): string[] {
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

  requireValid(item: LegacyChallengeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyChallengeAudit[]): Map<string, string[]> {
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

export function defaultLegacyChallengeAuditValidator(): LegacyChallengeAuditValidator {
  return new LegacyChallengeAuditValidator(
    [
      new LegacyChallengeAuditWindowDaysRangeRule(64, 120),
      new LegacyChallengeAuditNameLengthRule(255),
      new LegacyChallengeAuditAllowedRegionRule(["regional", "adaptive", "lenient"]),
      new LegacyChallengeAuditRequiredCodeRule("legacy challenge audit needs this field"),
      new LegacyChallengeAuditExpiresAtRangeRule(32, 255),
      new LegacyChallengeAuditCodePrefixRule("ACM"),
    ],
  );
}
