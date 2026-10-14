import { PendingEscalationSlot } from "./pending-escalation-slot.js";

/** A rule a pending escalation slot must pass. Check returns its problems, or none. */
export interface PendingEscalationSlotRule {
  check(item: PendingEscalationSlot): string[];
}

export class PendingEscalationSlotRequiredCodeRule implements PendingEscalationSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingEscalationSlotOwnerIdLengthRule implements PendingEscalationSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingEscalationSlot): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingEscalationSlotOpenRateRangeRule implements PendingEscalationSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingEscalationSlot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingEscalationSlotCodeLengthRule implements PendingEscalationSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingEscalationSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingEscalationSlotRequiredChannelRule implements PendingEscalationSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationSlot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending escalation slot. */
export class PendingEscalationSlotValidator {
  rules: PendingEscalationSlotRule[];

  constructor(rules: PendingEscalationSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingEscalationSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingEscalationSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingEscalationSlot[]): Map<string, string[]> {
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

export function defaultPendingEscalationSlotValidator(): PendingEscalationSlotValidator {
  return new PendingEscalationSlotValidator(
    [
      new PendingEscalationSlotRequiredCodeRule("pending escalation slot needs an entry"),
      new PendingEscalationSlotOwnerIdLengthRule(120),
      new PendingEscalationSlotOpenRateRangeRule(8.3, 4435.3),
      new PendingEscalationSlotCodeLengthRule(1000),
      new PendingEscalationSlotRequiredChannelRule("pending escalation slot needs a value"),
    ],
  );
}
