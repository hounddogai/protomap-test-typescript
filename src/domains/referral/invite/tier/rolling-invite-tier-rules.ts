import { RollingInviteTier } from "./rolling-invite-tier.js";

/** A rule a rolling invite tier must pass. Check returns its problems, or none. */
export interface RollingInviteTierRule {
  check(item: RollingInviteTier): string[];
}

export class RollingInviteTierRequiredCodeRule implements RollingInviteTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingInviteTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingInviteTierRequiredNameRule implements RollingInviteTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingInviteTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingInviteTierRequiredCampaignRefRule implements RollingInviteTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingInviteTier): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingInviteTierNameLengthRule implements RollingInviteTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingInviteTier): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingInviteTierCodePrefixRule implements RollingInviteTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingInviteTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling invite tier. */
export class RollingInviteTierValidator {
  rules: RollingInviteTierRule[];

  constructor(rules: RollingInviteTierRule[]) {
    this.rules = rules;
  }

  validate(item: RollingInviteTier): string[] {
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

  requireValid(item: RollingInviteTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingInviteTier[]): Map<string, string[]> {
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

export function defaultRollingInviteTierValidator(): RollingInviteTierValidator {
  return new RollingInviteTierValidator(
    [
      new RollingInviteTierRequiredCodeRule("rolling invite tier needs an entry"),
      new RollingInviteTierRequiredNameRule("rolling invite tier needs an entry"),
      new RollingInviteTierRequiredCampaignRefRule("rolling invite tier needs this field"),
      new RollingInviteTierNameLengthRule(32),
      new RollingInviteTierCodePrefixRule("X"),
    ],
  );
}
