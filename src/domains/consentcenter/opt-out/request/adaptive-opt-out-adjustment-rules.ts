import { AdaptiveOptOutAdjustment } from "./adaptive-opt-out-adjustment.js";

/** A rule a adaptive opt out adjustment must pass. Check returns its problems, or none. */
export interface AdaptiveOptOutAdjustmentRule {
  check(item: AdaptiveOptOutAdjustment): string[];
}

export class AdaptiveOptOutAdjustmentAudienceIdLengthRule implements AdaptiveOptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveOptOutAdjustment): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveOptOutAdjustmentRequiredCohortRule implements AdaptiveOptOutAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveOptOutAdjustment): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveOptOutAdjustmentCodeLengthRule implements AdaptiveOptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveOptOutAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive opt out adjustment. */
export class AdaptiveOptOutAdjustmentValidator {
  rules: AdaptiveOptOutAdjustmentRule[];

  constructor(rules: AdaptiveOptOutAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveOptOutAdjustment): string[] {
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

  requireValid(item: AdaptiveOptOutAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveOptOutAdjustment[]): Map<string, string[]> {
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

export function defaultAdaptiveOptOutAdjustmentValidator(): AdaptiveOptOutAdjustmentValidator {
  return new AdaptiveOptOutAdjustmentValidator(
    [
      new AdaptiveOptOutAdjustmentAudienceIdLengthRule(80),
      new AdaptiveOptOutAdjustmentRequiredCohortRule("adaptive opt out adjustment needs a value"),
      new AdaptiveOptOutAdjustmentCodeLengthRule(80),
    ],
  );
}
