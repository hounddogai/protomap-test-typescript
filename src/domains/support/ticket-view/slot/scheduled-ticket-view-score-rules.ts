import { ScheduledTicketViewScore } from "./scheduled-ticket-view-score.js";

/** A rule a scheduled ticket view score must pass. Check returns its problems, or none. */
export interface ScheduledTicketViewScoreRule {
  check(item: ScheduledTicketViewScore): string[];
}

export class ScheduledTicketViewScoreRequiredVariantRule implements ScheduledTicketViewScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTicketViewScore): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTicketViewScoreNameLengthRule implements ScheduledTicketViewScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTicketViewScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTicketViewScoreRequiredRegionRule implements ScheduledTicketViewScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTicketViewScore): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTicketViewScoreVariantLengthRule implements ScheduledTicketViewScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTicketViewScore): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTicketViewScoreCodeLengthRule implements ScheduledTicketViewScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTicketViewScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled ticket view score. */
export class ScheduledTicketViewScoreValidator {
  rules: ScheduledTicketViewScoreRule[];

  constructor(rules: ScheduledTicketViewScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTicketViewScore): string[] {
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

  requireValid(item: ScheduledTicketViewScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTicketViewScore[]): Map<string, string[]> {
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

export function defaultScheduledTicketViewScoreValidator(): ScheduledTicketViewScoreValidator {
  return new ScheduledTicketViewScoreValidator(
    [
      new ScheduledTicketViewScoreRequiredVariantRule("scheduled ticket view score needs this field"),
      new ScheduledTicketViewScoreNameLengthRule(32),
      new ScheduledTicketViewScoreRequiredRegionRule("scheduled ticket view score needs a value"),
      new ScheduledTicketViewScoreVariantLengthRule(1000),
      new ScheduledTicketViewScoreCodeLengthRule(1000),
    ],
  );
}
