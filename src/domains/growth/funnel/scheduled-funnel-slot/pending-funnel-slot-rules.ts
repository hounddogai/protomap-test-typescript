import { PendingFunnelSlot } from "./pending-funnel-slot.js";

/** A rule a pending funnel slot must pass. Check returns its problems, or none. */
export interface PendingFunnelSlotRule {
  check(item: PendingFunnelSlot): string[];
}

export class PendingFunnelSlotCodeLengthRule implements PendingFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFunnelSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFunnelSlotNotesLengthRule implements PendingFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFunnelSlot): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFunnelSlotAttemptsRangeRule implements PendingFunnelSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFunnelSlot): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingFunnelSlotNameLengthRule implements PendingFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFunnelSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFunnelSlotRequiredNotesRule implements PendingFunnelSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFunnelSlot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending funnel slot. */
export class PendingFunnelSlotValidator {
  rules: PendingFunnelSlotRule[];

  constructor(rules: PendingFunnelSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFunnelSlot): string[] {
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

  requireValid(item: PendingFunnelSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFunnelSlot[]): Map<string, string[]> {
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

export function defaultPendingFunnelSlotValidator(): PendingFunnelSlotValidator {
  return new PendingFunnelSlotValidator(
    [
      new PendingFunnelSlotCodeLengthRule(120),
      new PendingFunnelSlotNotesLengthRule(255),
      new PendingFunnelSlotAttemptsRangeRule(255, 86400),
      new PendingFunnelSlotNameLengthRule(64),
      new PendingFunnelSlotRequiredNotesRule("pending funnel slot needs an entry"),
    ],
  );
}
