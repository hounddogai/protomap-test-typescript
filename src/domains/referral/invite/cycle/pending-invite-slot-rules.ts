import { PendingInviteSlot } from "./pending-invite-slot.js";

/** A rule a pending invite slot must pass. Check returns its problems, or none. */
export interface PendingInviteSlotRule {
  check(item: PendingInviteSlot): string[];
}

export class PendingInviteSlotBatchSizeRangeRule implements PendingInviteSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingInviteSlot): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingInviteSlotNotesLengthRule implements PendingInviteSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInviteSlot): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInviteSlotRequiredCodeRule implements PendingInviteSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInviteSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInviteSlotRequiredNotesRule implements PendingInviteSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInviteSlot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending invite slot. */
export class PendingInviteSlotValidator {
  rules: PendingInviteSlotRule[];

  constructor(rules: PendingInviteSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInviteSlot): string[] {
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

  requireValid(item: PendingInviteSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInviteSlot[]): Map<string, string[]> {
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

export function defaultPendingInviteSlotValidator(): PendingInviteSlotValidator {
  return new PendingInviteSlotValidator(
    [
      new PendingInviteSlotBatchSizeRangeRule(16, 64),
      new PendingInviteSlotNotesLengthRule(64),
      new PendingInviteSlotRequiredCodeRule("pending invite slot needs an entry"),
      new PendingInviteSlotRequiredNotesRule("pending invite slot needs this field"),
    ],
  );
}
