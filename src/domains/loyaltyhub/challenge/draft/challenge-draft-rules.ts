import { ChallengeDraft } from "./challenge-draft.js";

/** A rule a challenge draft must pass. Check returns its problems, or none. */
export interface ChallengeDraftRule {
  check(item: ChallengeDraft): string[];
}

export class ChallengeDraftCodeLengthRule implements ChallengeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeDraftLabelLengthRule implements ChallengeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeDraftBidRangeRule implements ChallengeDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeDraft): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeDraftCampaignRefLengthRule implements ChallengeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeDraft): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeDraftRequiredCampaignRefRule implements ChallengeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeDraft): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge draft. */
export class ChallengeDraftValidator {
  rules: ChallengeDraftRule[];

  constructor(rules: ChallengeDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeDraft): string[] {
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

  requireValid(item: ChallengeDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeDraft[]): Map<string, string[]> {
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

export function defaultChallengeDraftValidator(): ChallengeDraftValidator {
  return new ChallengeDraftValidator(
    [
      new ChallengeDraftCodeLengthRule(1000),
      new ChallengeDraftLabelLengthRule(1000),
      new ChallengeDraftBidRangeRule(0, 118.2),
      new ChallengeDraftCampaignRefLengthRule(64),
      new ChallengeDraftRequiredCampaignRefRule("challenge draft needs a value"),
    ],
  );
}
