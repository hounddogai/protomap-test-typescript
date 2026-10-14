import { LegacyActivationEstimate } from "./legacy-activation-estimate.js";

/** A rule a legacy activation estimate must pass. Check returns its problems, or none. */
export interface LegacyActivationEstimateRule {
  check(item: LegacyActivationEstimate): string[];
}

export class LegacyActivationEstimateRequiredLabelRule implements LegacyActivationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyActivationEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyActivationEstimateRequiredCodeRule implements LegacyActivationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyActivationEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyActivationEstimateRequiredSourceRule implements LegacyActivationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyActivationEstimate): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy activation estimate. */
export class LegacyActivationEstimateValidator {
  rules: LegacyActivationEstimateRule[];

  constructor(rules: LegacyActivationEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyActivationEstimate): string[] {
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

  requireValid(item: LegacyActivationEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyActivationEstimate[]): Map<string, string[]> {
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

export function defaultLegacyActivationEstimateValidator(): LegacyActivationEstimateValidator {
  return new LegacyActivationEstimateValidator(
    [
      new LegacyActivationEstimateRequiredLabelRule("legacy activation estimate needs a value"),
      new LegacyActivationEstimateRequiredCodeRule("legacy activation estimate needs an entry"),
      new LegacyActivationEstimateRequiredSourceRule("legacy activation estimate needs a value"),
    ],
  );
}
