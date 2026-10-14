import { LegacyInviteAdjustment } from "./legacy-invite-adjustment.js";

/** A rule a legacy invite adjustment must pass. Check returns its problems, or none. */
export interface LegacyInviteAdjustmentRule {
  check(item: LegacyInviteAdjustment): string[];
}

export class LegacyInviteAdjustmentRequiredNameRule implements LegacyInviteAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyInviteAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyInviteAdjustmentCodePrefixRule implements LegacyInviteAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyInviteAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyInviteAdjustmentCodeLengthRule implements LegacyInviteAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyInviteAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy invite adjustment. */
export class LegacyInviteAdjustmentValidator {
  rules: LegacyInviteAdjustmentRule[];

  constructor(rules: LegacyInviteAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyInviteAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyInviteAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyInviteAdjustment[]): Map<string, string[]> {
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

export function defaultLegacyInviteAdjustmentValidator(): LegacyInviteAdjustmentValidator {
  return new LegacyInviteAdjustmentValidator(
    [
      new LegacyInviteAdjustmentRequiredNameRule("legacy invite adjustment needs a value"),
      new LegacyInviteAdjustmentCodePrefixRule("X"),
      new LegacyInviteAdjustmentCodeLengthRule(16),
    ],
  );
}
