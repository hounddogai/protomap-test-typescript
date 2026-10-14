import { AdaptiveFrequencyGroup } from "./adaptive-frequency-group.js";

/** A rule a adaptive frequency group must pass. Check returns its problems, or none. */
export interface AdaptiveFrequencyGroupRule {
  check(item: AdaptiveFrequencyGroup): string[];
}

export class AdaptiveFrequencyGroupRequiredCodeRule implements AdaptiveFrequencyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFrequencyGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFrequencyGroupRequiredJourneyIdRule implements AdaptiveFrequencyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFrequencyGroup): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFrequencyGroupJourneyIdLengthRule implements AdaptiveFrequencyGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFrequencyGroup): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFrequencyGroupRequiredLabelRule implements AdaptiveFrequencyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFrequencyGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive frequency group. */
export class AdaptiveFrequencyGroupValidator {
  rules: AdaptiveFrequencyGroupRule[];

  constructor(rules: AdaptiveFrequencyGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFrequencyGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFrequencyGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFrequencyGroup[]): Map<string, string[]> {
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

export function defaultAdaptiveFrequencyGroupValidator(): AdaptiveFrequencyGroupValidator {
  return new AdaptiveFrequencyGroupValidator(
    [
      new AdaptiveFrequencyGroupRequiredCodeRule("adaptive frequency group needs this field"),
      new AdaptiveFrequencyGroupRequiredJourneyIdRule("adaptive frequency group needs this field"),
      new AdaptiveFrequencyGroupJourneyIdLengthRule(86400),
      new AdaptiveFrequencyGroupRequiredLabelRule("adaptive frequency group needs this field"),
    ],
  );
}
