import { SlaProfile } from "./sla-profile.js";

/** A rule a sla profile must pass. Check returns its problems, or none. */
export interface SlaProfileRule {
  check(item: SlaProfile): string[];
}

export class SlaProfileQuantityRangeRule implements SlaProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaProfile): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaProfileRequiredJourneyIdRule implements SlaProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaProfile): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class SlaProfileSendAtRangeRule implements SlaProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaProfile): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a sla profile. */
export class SlaProfileValidator {
  rules: SlaProfileRule[];

  constructor(rules: SlaProfileRule[]) {
    this.rules = rules;
  }

  validate(item: SlaProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaProfile[]): Map<string, string[]> {
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

export function defaultSlaProfileValidator(): SlaProfileValidator {
  return new SlaProfileValidator(
    [
      new SlaProfileQuantityRangeRule(32, 120),
      new SlaProfileRequiredJourneyIdRule("sla profile needs an entry"),
      new SlaProfileSendAtRangeRule(64, 80),
    ],
  );
}
