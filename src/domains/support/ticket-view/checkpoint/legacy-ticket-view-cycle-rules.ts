import * as text from "../../../../kit/text.js";
import { LegacyTicketViewCycle } from "./legacy-ticket-view-cycle.js";

/** A rule a legacy ticket view cycle must pass. Check returns its problems, or none. */
export interface LegacyTicketViewCycleRule {
  check(item: LegacyTicketViewCycle): string[];
}

export class LegacyTicketViewCycleNotesLengthRule implements LegacyTicketViewCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTicketViewCycle): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyTicketViewCycleCodePrefixRule implements LegacyTicketViewCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyTicketViewCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyTicketViewCycleEndsAtRangeRule implements LegacyTicketViewCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTicketViewCycle): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyTicketViewCycleCodeLengthRule implements LegacyTicketViewCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTicketViewCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyTicketViewCycleAllowedNotesRule implements LegacyTicketViewCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyTicketViewCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is too long`];
    return [];
  }
}

/** Runs every rule of a legacy ticket view cycle. */
export class LegacyTicketViewCycleValidator {
  rules: LegacyTicketViewCycleRule[];

  constructor(rules: LegacyTicketViewCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTicketViewCycle): string[] {
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

  requireValid(item: LegacyTicketViewCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTicketViewCycle[]): Map<string, string[]> {
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

export function defaultLegacyTicketViewCycleValidator(): LegacyTicketViewCycleValidator {
  return new LegacyTicketViewCycleValidator(
    [
      new LegacyTicketViewCycleNotesLengthRule(3600),
      new LegacyTicketViewCycleCodePrefixRule("OPS"),
      new LegacyTicketViewCycleEndsAtRangeRule(1000, 86400),
      new LegacyTicketViewCycleCodeLengthRule(86400),
      new LegacyTicketViewCycleAllowedNotesRule(["capped", "fallback"]),
    ],
  );
}
