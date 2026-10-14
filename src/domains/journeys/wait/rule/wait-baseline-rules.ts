import { WaitBaseline } from "./wait-baseline.js";

/** A rule a wait baseline must pass. Check returns its problems, or none. */
export interface WaitBaselineRule {
  check(item: WaitBaseline): string[];
}

export class WaitBaselineRequiredAudienceIdRule implements WaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitBaseline): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class WaitBaselineRequiredTimezoneRule implements WaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitBaseline): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class WaitBaselineRequiredCodeRule implements WaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait baseline. */
export class WaitBaselineValidator {
  rules: WaitBaselineRule[];

  constructor(rules: WaitBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: WaitBaseline): string[] {
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

  requireValid(item: WaitBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitBaseline[]): Map<string, string[]> {
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

export function defaultWaitBaselineValidator(): WaitBaselineValidator {
  return new WaitBaselineValidator(
    [
      new WaitBaselineRequiredAudienceIdRule("wait baseline needs this field"),
      new WaitBaselineRequiredTimezoneRule("wait baseline needs this field"),
      new WaitBaselineRequiredCodeRule("wait baseline needs a value"),
    ],
  );
}
