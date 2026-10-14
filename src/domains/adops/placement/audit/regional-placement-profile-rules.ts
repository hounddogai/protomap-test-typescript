import { RegionalPlacementProfile } from "./regional-placement-profile.js";

/** A rule a regional placement profile must pass. Check returns its problems, or none. */
export interface RegionalPlacementProfileRule {
  check(item: RegionalPlacementProfile): string[];
}

export class RegionalPlacementProfileTitleLengthRule implements RegionalPlacementProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementProfileAudienceIdLengthRule implements RegionalPlacementProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementProfile): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementProfileActiveGuardRule implements RegionalPlacementProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalPlacementProfile): string[] {
    if (item.active && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a regional placement profile. */
export class RegionalPlacementProfileValidator {
  rules: RegionalPlacementProfileRule[];

  constructor(rules: RegionalPlacementProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPlacementProfile): string[] {
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

  requireValid(item: RegionalPlacementProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPlacementProfile[]): Map<string, string[]> {
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

export function defaultRegionalPlacementProfileValidator(): RegionalPlacementProfileValidator {
  return new RegionalPlacementProfileValidator(
    [
      new RegionalPlacementProfileTitleLengthRule(255),
      new RegionalPlacementProfileAudienceIdLengthRule(1000),
      new RegionalPlacementProfileActiveGuardRule(1000),
    ],
  );
}
