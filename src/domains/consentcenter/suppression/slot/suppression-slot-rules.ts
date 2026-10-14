import { SuppressionSlot } from "./suppression-slot.js";

/** A rule a suppression slot must pass. Check returns its problems, or none. */
export interface SuppressionSlotRule {
  check(item: SuppressionSlot): string[];
}

export class SuppressionSlotCodePrefixRule implements SuppressionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionSlotPinnedGuardRule implements SuppressionSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SuppressionSlot): string[] {
    if (item.pinned && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SuppressionSlotRequiredNameRule implements SuppressionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionSlotNameLengthRule implements SuppressionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionSlotRequiredCodeRule implements SuppressionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression slot. */
export class SuppressionSlotValidator {
  rules: SuppressionSlotRule[];

  constructor(rules: SuppressionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionSlot): string[] {
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

  requireValid(item: SuppressionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionSlot[]): Map<string, string[]> {
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

export function defaultSuppressionSlotValidator(): SuppressionSlotValidator {
  return new SuppressionSlotValidator(
    [
      new SuppressionSlotCodePrefixRule("Q"),
      new SuppressionSlotPinnedGuardRule(16),
      new SuppressionSlotRequiredNameRule("suppression slot needs a value"),
      new SuppressionSlotNameLengthRule(120),
      new SuppressionSlotRequiredCodeRule("suppression slot needs an entry"),
    ],
  );
}
