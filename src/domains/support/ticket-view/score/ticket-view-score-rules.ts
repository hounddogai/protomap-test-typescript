import { TicketViewScore } from "./ticket-view-score.js";

/** A rule a ticket view score must pass. Check returns its problems, or none. */
export interface TicketViewScoreRule {
  check(item: TicketViewScore): string[];
}

export class TicketViewScorePriorityRangeRule implements TicketViewScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewScore): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewScoreRegionLengthRule implements TicketViewScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewScore): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewScoreRequiredCampaignRefRule implements TicketViewScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewScore): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewScoreRequiredRegionRule implements TicketViewScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewScore): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view score. */
export class TicketViewScoreValidator {
  rules: TicketViewScoreRule[];

  constructor(rules: TicketViewScoreRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewScore[]): Map<string, string[]> {
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

export function defaultTicketViewScoreValidator(): TicketViewScoreValidator {
  return new TicketViewScoreValidator(
    [
      new TicketViewScorePriorityRangeRule(80, 120),
      new TicketViewScoreRegionLengthRule(1000),
      new TicketViewScoreRequiredCampaignRefRule("ticket view score needs this field"),
      new TicketViewScoreRequiredRegionRule("ticket view score needs this field"),
    ],
  );
}
