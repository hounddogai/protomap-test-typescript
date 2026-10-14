import { RegionalPacingSlot } from "./regional-pacing-slot.js";

/** A rule a regional pacing slot must pass. Check returns its problems, or none. */
export interface RegionalPacingSlotRule {
  check(item: RegionalPacingSlot): string[];
}

export class RegionalPacingSlotTitleLengthRule implements RegionalPacingSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPacingSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPacingSlotCodePrefixRule implements RegionalPacingSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalPacingSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalPacingSlotLabelLengthRule implements RegionalPacingSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPacingSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional pacing slot. */
export class RegionalPacingSlotValidator {
  rules: RegionalPacingSlotRule[];

  constructor(rules: RegionalPacingSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPacingSlot): string[] {
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

  requireValid(item: RegionalPacingSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPacingSlot[]): Map<string, string[]> {
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

export function defaultRegionalPacingSlotValidator(): RegionalPacingSlotValidator {
  return new RegionalPacingSlotValidator(
    [
      new RegionalPacingSlotTitleLengthRule(32),
      new RegionalPacingSlotCodePrefixRule("REF"),
      new RegionalPacingSlotLabelLengthRule(86400),
    ],
  );
}
