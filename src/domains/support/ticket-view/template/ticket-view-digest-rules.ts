import { TicketViewDigest } from "./ticket-view-digest.js";

/** A rule a ticket view digest must pass. Check returns its problems, or none. */
export interface TicketViewDigestRule {
  check(item: TicketViewDigest): string[];
}

export class TicketViewDigestRequiredCodeRule implements TicketViewDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewDigestCodePrefixRule implements TicketViewDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewDigestCodeLengthRule implements TicketViewDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewDigestWeightRangeRule implements TicketViewDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewDigest): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a ticket view digest. */
export class TicketViewDigestValidator {
  rules: TicketViewDigestRule[];

  constructor(rules: TicketViewDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewDigest): string[] {
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

  requireValid(item: TicketViewDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewDigest[]): Map<string, string[]> {
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

export function defaultTicketViewDigestValidator(): TicketViewDigestValidator {
  return new TicketViewDigestValidator(
    [
      new TicketViewDigestRequiredCodeRule("ticket view digest needs a value"),
      new TicketViewDigestCodePrefixRule("OPS"),
      new TicketViewDigestCodeLengthRule(1000),
      new TicketViewDigestWeightRangeRule(5.7, 1076.4),
    ],
  );
}
