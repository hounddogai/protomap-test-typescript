import * as text from "../../../../kit/text.js";
import { LegacyInviteBatch } from "./legacy-invite-batch.js";

/** A rule a legacy invite batch must pass. Check returns its problems, or none. */
export interface LegacyInviteBatchRule {
  check(item: LegacyInviteBatch): string[];
}

export class LegacyInviteBatchAllowedNameRule implements LegacyInviteBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyInviteBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class LegacyInviteBatchCodeLengthRule implements LegacyInviteBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyInviteBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyInviteBatchCodePrefixRule implements LegacyInviteBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyInviteBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy invite batch. */
export class LegacyInviteBatchValidator {
  rules: LegacyInviteBatchRule[];

  constructor(rules: LegacyInviteBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyInviteBatch): string[] {
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

  requireValid(item: LegacyInviteBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyInviteBatch[]): Map<string, string[]> {
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

export function defaultLegacyInviteBatchValidator(): LegacyInviteBatchValidator {
  return new LegacyInviteBatchValidator(
    [
      new LegacyInviteBatchAllowedNameRule(["default", "manual"]),
      new LegacyInviteBatchCodeLengthRule(255),
      new LegacyInviteBatchCodePrefixRule("ACM"),
    ],
  );
}
