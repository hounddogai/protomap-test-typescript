import { AdaptiveJourneyBaseline } from "./adaptive-journey-baseline.js";

/** A rule a adaptive journey baseline must pass. Check returns its problems, or none. */
export interface AdaptiveJourneyBaselineRule {
  check(item: AdaptiveJourneyBaseline): string[];
}

export class AdaptiveJourneyBaselineLabelLengthRule implements AdaptiveJourneyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveJourneyBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveJourneyBaselineChannelLengthRule implements AdaptiveJourneyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveJourneyBaseline): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveJourneyBaselineExternalRefLengthRule implements AdaptiveJourneyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveJourneyBaseline): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveJourneyBaselineRequiredCodeRule implements AdaptiveJourneyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveJourneyBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive journey baseline. */
export class AdaptiveJourneyBaselineValidator {
  rules: AdaptiveJourneyBaselineRule[];

  constructor(rules: AdaptiveJourneyBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveJourneyBaseline): string[] {
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

  requireValid(item: AdaptiveJourneyBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveJourneyBaseline[]): Map<string, string[]> {
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

export function defaultAdaptiveJourneyBaselineValidator(): AdaptiveJourneyBaselineValidator {
  return new AdaptiveJourneyBaselineValidator(
    [
      new AdaptiveJourneyBaselineLabelLengthRule(86400),
      new AdaptiveJourneyBaselineChannelLengthRule(3600),
      new AdaptiveJourneyBaselineExternalRefLengthRule(64),
      new AdaptiveJourneyBaselineRequiredCodeRule("adaptive journey baseline needs an entry"),
    ],
  );
}
