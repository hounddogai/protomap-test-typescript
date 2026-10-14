import { ManualMentionClaim } from "./manual-mention-claim.js";

/** A rule a manual mention claim must pass. Check returns its problems, or none. */
export interface ManualMentionClaimRule {
  check(item: ManualMentionClaim): string[];
}

export class ManualMentionClaimCodePrefixRule implements ManualMentionClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualMentionClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualMentionClaimDurationMinutesRangeRule implements ManualMentionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualMentionClaim): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualMentionClaimArchivedGuardRule implements ManualMentionClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualMentionClaim): string[] {
    if (item.archived && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ManualMentionClaimRequiredNameRule implements ManualMentionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualMentionClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual mention claim. */
export class ManualMentionClaimValidator {
  rules: ManualMentionClaimRule[];

  constructor(rules: ManualMentionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ManualMentionClaim): string[] {
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

  requireValid(item: ManualMentionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualMentionClaim[]): Map<string, string[]> {
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

export function defaultManualMentionClaimValidator(): ManualMentionClaimValidator {
  return new ManualMentionClaimValidator(
    [
      new ManualMentionClaimCodePrefixRule("REF"),
      new ManualMentionClaimDurationMinutesRangeRule(64, 120),
      new ManualMentionClaimArchivedGuardRule(3600),
      new ManualMentionClaimRequiredNameRule("manual mention claim needs this field"),
    ],
  );
}
