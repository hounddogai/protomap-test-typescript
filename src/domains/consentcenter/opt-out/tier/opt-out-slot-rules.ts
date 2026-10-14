import { OptOutSlot } from "./opt-out-slot.js";

/** A rule a opt out slot must pass. Check returns its problems, or none. */
export interface OptOutSlotRule {
  check(item: OptOutSlot): string[];
}

export class OptOutSlotCodeLengthRule implements OptOutSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutSlotRequiredCohortRule implements OptOutSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutSlot): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutSlotTitleLengthRule implements OptOutSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutSlotCohortLengthRule implements OptOutSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutSlot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutSlotCodePrefixRule implements OptOutSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a opt out slot. */
export class OptOutSlotValidator {
  rules: OptOutSlotRule[];

  constructor(rules: OptOutSlotRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutSlot): string[] {
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

  requireValid(item: OptOutSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutSlot[]): Map<string, string[]> {
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

export function defaultOptOutSlotValidator(): OptOutSlotValidator {
  return new OptOutSlotValidator(
    [
      new OptOutSlotCodeLengthRule(255),
      new OptOutSlotRequiredCohortRule("opt out slot needs this field"),
      new OptOutSlotTitleLengthRule(3600),
      new OptOutSlotCohortLengthRule(1000),
      new OptOutSlotCodePrefixRule("X"),
    ],
  );
}
