import { AdaptiveTicketViewDigest } from "./adaptive-ticket-view-digest.js";

/** A rule a adaptive ticket view digest must pass. Check returns its problems, or none. */
export interface AdaptiveTicketViewDigestRule {
  check(item: AdaptiveTicketViewDigest): string[];
}

export class AdaptiveTicketViewDigestRequiredRegionRule implements AdaptiveTicketViewDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewDigest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTicketViewDigestWeightRangeRule implements AdaptiveTicketViewDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveTicketViewDigest): string[] {
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

export class AdaptiveTicketViewDigestRequiredSourceRule implements AdaptiveTicketViewDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewDigest): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive ticket view digest. */
export class AdaptiveTicketViewDigestValidator {
  rules: AdaptiveTicketViewDigestRule[];

  constructor(rules: AdaptiveTicketViewDigestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTicketViewDigest): string[] {
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

  requireValid(item: AdaptiveTicketViewDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTicketViewDigest[]): Map<string, string[]> {
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

export function defaultAdaptiveTicketViewDigestValidator(): AdaptiveTicketViewDigestValidator {
  return new AdaptiveTicketViewDigestValidator(
    [
      new AdaptiveTicketViewDigestRequiredRegionRule("adaptive ticket view digest needs this field"),
      new AdaptiveTicketViewDigestWeightRangeRule(8.7, 1467.7),
      new AdaptiveTicketViewDigestRequiredSourceRule("adaptive ticket view digest needs this field"),
    ],
  );
}
