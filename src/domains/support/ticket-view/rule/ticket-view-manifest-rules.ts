import { TicketViewManifest } from "./ticket-view-manifest.js";

/** A rule a ticket view manifest must pass. Check returns its problems, or none. */
export interface TicketViewManifestRule {
  check(item: TicketViewManifest): string[];
}

export class TicketViewManifestFrequencyCapRangeRule implements TicketViewManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewManifest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewManifestSendAtRangeRule implements TicketViewManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewManifest): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewManifestRequiredCodeRule implements TicketViewManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view manifest. */
export class TicketViewManifestValidator {
  rules: TicketViewManifestRule[];

  constructor(rules: TicketViewManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewManifest): string[] {
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

  requireValid(item: TicketViewManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewManifest[]): Map<string, string[]> {
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

export function defaultTicketViewManifestValidator(): TicketViewManifestValidator {
  return new TicketViewManifestValidator(
    [
      new TicketViewManifestFrequencyCapRangeRule(120, 120),
      new TicketViewManifestSendAtRangeRule(32, 64),
      new TicketViewManifestRequiredCodeRule("ticket view manifest needs a value"),
    ],
  );
}
