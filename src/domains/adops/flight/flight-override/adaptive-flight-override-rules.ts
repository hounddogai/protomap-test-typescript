import { AdaptiveFlightOverride } from "./adaptive-flight-override.js";

/** A rule a adaptive flight override must pass. Check returns its problems, or none. */
export interface AdaptiveFlightOverrideRule {
  check(item: AdaptiveFlightOverride): string[];
}

export class AdaptiveFlightOverrideConversionRateRangeRule implements AdaptiveFlightOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFlightOverride): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveFlightOverrideExpiresAtRangeRule implements AdaptiveFlightOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFlightOverride): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFlightOverrideRequiredJourneyIdRule implements AdaptiveFlightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFlightOverride): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFlightOverrideCodePrefixRule implements AdaptiveFlightOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveFlightOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveFlightOverrideUpdatedAtRangeRule implements AdaptiveFlightOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFlightOverride): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive flight override. */
export class AdaptiveFlightOverrideValidator {
  rules: AdaptiveFlightOverrideRule[];

  constructor(rules: AdaptiveFlightOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFlightOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFlightOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFlightOverride[]): Map<string, string[]> {
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

export function defaultAdaptiveFlightOverrideValidator(): AdaptiveFlightOverrideValidator {
  return new AdaptiveFlightOverrideValidator(
    [
      new AdaptiveFlightOverrideConversionRateRangeRule(4.4, 3655.2),
      new AdaptiveFlightOverrideExpiresAtRangeRule(80, 255),
      new AdaptiveFlightOverrideRequiredJourneyIdRule("adaptive flight override needs this field"),
      new AdaptiveFlightOverrideCodePrefixRule("REF"),
      new AdaptiveFlightOverrideUpdatedAtRangeRule(120, 3600),
    ],
  );
}
