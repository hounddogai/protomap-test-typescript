import { TieredTouchpointPreference } from "./tiered-touchpoint-preference.js";

/** A rule a tiered touchpoint preference must pass. Check returns its problems, or none. */
export interface TieredTouchpointPreferenceRule {
  check(item: TieredTouchpointPreference): string[];
}

export class TieredTouchpointPreferenceRequiredUtmSourceRule implements TieredTouchpointPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointPreference): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointPreferenceRequiredNameRule implements TieredTouchpointPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointPreferenceRequiredCountryRule implements TieredTouchpointPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointPreference): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered touchpoint preference. */
export class TieredTouchpointPreferenceValidator {
  rules: TieredTouchpointPreferenceRule[];

  constructor(rules: TieredTouchpointPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTouchpointPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTouchpointPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTouchpointPreference[]): Map<string, string[]> {
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

export function defaultTieredTouchpointPreferenceValidator(): TieredTouchpointPreferenceValidator {
  return new TieredTouchpointPreferenceValidator(
    [
      new TieredTouchpointPreferenceRequiredUtmSourceRule("tiered touchpoint preference needs a value"),
      new TieredTouchpointPreferenceRequiredNameRule("tiered touchpoint preference needs a value"),
      new TieredTouchpointPreferenceRequiredCountryRule("tiered touchpoint preference needs this field"),
    ],
  );
}
