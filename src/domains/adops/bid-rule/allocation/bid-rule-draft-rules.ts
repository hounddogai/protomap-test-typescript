import { BidRuleDraft } from "./bid-rule-draft.js";

/** A rule a bid rule draft must pass. Check returns its problems, or none. */
export interface BidRuleDraftRule {
  check(item: BidRuleDraft): string[];
}

export class BidRuleDraftJourneyIdLengthRule implements BidRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleDraft): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleDraftCodeLengthRule implements BidRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleDraftRequiredJourneyIdRule implements BidRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleDraft): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleDraftRequiredTitleRule implements BidRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleDraftRequiredCodeRule implements BidRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule draft. */
export class BidRuleDraftValidator {
  rules: BidRuleDraftRule[];

  constructor(rules: BidRuleDraftRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleDraft[]): Map<string, string[]> {
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

export function defaultBidRuleDraftValidator(): BidRuleDraftValidator {
  return new BidRuleDraftValidator(
    [
      new BidRuleDraftJourneyIdLengthRule(1000),
      new BidRuleDraftCodeLengthRule(86400),
      new BidRuleDraftRequiredJourneyIdRule("bid rule draft needs a value"),
      new BidRuleDraftRequiredTitleRule("bid rule draft needs a value"),
      new BidRuleDraftRequiredCodeRule("bid rule draft needs an entry"),
    ],
  );
}
