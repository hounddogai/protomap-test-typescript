import { PlacementProfile } from "./placement-profile.js";

/** A rule a placement profile must pass. Check returns its problems, or none. */
export interface PlacementProfileRule {
  check(item: PlacementProfile): string[];
}

export class PlacementProfileTitleLengthRule implements PlacementProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementProfileCodeLengthRule implements PlacementProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementProfileRequiredJourneyIdRule implements PlacementProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementProfile): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement profile. */
export class PlacementProfileValidator {
  rules: PlacementProfileRule[];

  constructor(rules: PlacementProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementProfile): string[] {
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

  requireValid(item: PlacementProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementProfile[]): Map<string, string[]> {
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

export function defaultPlacementProfileValidator(): PlacementProfileValidator {
  return new PlacementProfileValidator(
    [
      new PlacementProfileTitleLengthRule(1000),
      new PlacementProfileCodeLengthRule(120),
      new PlacementProfileRequiredJourneyIdRule("placement profile needs a value"),
    ],
  );
}
