import * as text from "../../../../kit/text.js";
import { JourneySlot } from "./journey-slot.js";

/** A rule a journey slot must pass. Check returns its problems, or none. */
export interface JourneySlotRule {
  check(item: JourneySlot): string[];
}

export class JourneySlotChecksumLengthRule implements JourneySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneySlot): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneySlotRequiredChecksumRule implements JourneySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneySlot): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class JourneySlotAllowedExternalRefRule implements JourneySlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneySlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

/** Runs every rule of a journey slot. */
export class JourneySlotValidator {
  rules: JourneySlotRule[];

  constructor(rules: JourneySlotRule[]) {
    this.rules = rules;
  }

  validate(item: JourneySlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneySlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneySlot[]): Map<string, string[]> {
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

export function defaultJourneySlotValidator(): JourneySlotValidator {
  return new JourneySlotValidator(
    [
      new JourneySlotChecksumLengthRule(1000),
      new JourneySlotRequiredChecksumRule("journey slot needs a value"),
      new JourneySlotAllowedExternalRefRule([]),
    ],
  );
}
