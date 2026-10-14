import { ScheduledFlightSlot } from "./scheduled-flight-slot.js";

/** A rule a scheduled flight slot must pass. Check returns its problems, or none. */
export interface ScheduledFlightSlotRule {
  check(item: ScheduledFlightSlot): string[];
}

export class ScheduledFlightSlotNameLengthRule implements ScheduledFlightSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFlightSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFlightSlotRequiredNameRule implements ScheduledFlightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFlightSlotLocaleLengthRule implements ScheduledFlightSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFlightSlot): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFlightSlotRequiredCodeRule implements ScheduledFlightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFlightSlotRequiredLocaleRule implements ScheduledFlightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightSlot): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled flight slot. */
export class ScheduledFlightSlotValidator {
  rules: ScheduledFlightSlotRule[];

  constructor(rules: ScheduledFlightSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFlightSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledFlightSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFlightSlot[]): Map<string, string[]> {
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

export function defaultScheduledFlightSlotValidator(): ScheduledFlightSlotValidator {
  return new ScheduledFlightSlotValidator(
    [
      new ScheduledFlightSlotNameLengthRule(255),
      new ScheduledFlightSlotRequiredNameRule("scheduled flight slot needs an entry"),
      new ScheduledFlightSlotLocaleLengthRule(255),
      new ScheduledFlightSlotRequiredCodeRule("scheduled flight slot needs a value"),
      new ScheduledFlightSlotRequiredLocaleRule("scheduled flight slot needs this field"),
    ],
  );
}
