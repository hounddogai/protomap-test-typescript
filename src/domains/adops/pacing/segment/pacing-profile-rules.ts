import { PacingProfile } from "./pacing-profile.js";

/** A rule a pacing profile must pass. Check returns its problems, or none. */
export interface PacingProfileRule {
  check(item: PacingProfile): string[];
}

export class PacingProfileRequiredCodeRule implements PacingProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingProfileCodeLengthRule implements PacingProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingProfileTitleLengthRule implements PacingProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingProfileExternalRefLengthRule implements PacingProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingProfile): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingProfileActiveGuardRule implements PacingProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingProfile): string[] {
    if (item.active && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a pacing profile. */
export class PacingProfileValidator {
  rules: PacingProfileRule[];

  constructor(rules: PacingProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PacingProfile): string[] {
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

  requireValid(item: PacingProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingProfile[]): Map<string, string[]> {
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

export function defaultPacingProfileValidator(): PacingProfileValidator {
  return new PacingProfileValidator(
    [
      new PacingProfileRequiredCodeRule("pacing profile needs this field"),
      new PacingProfileCodeLengthRule(64),
      new PacingProfileTitleLengthRule(16),
      new PacingProfileExternalRefLengthRule(86400),
      new PacingProfileActiveGuardRule(16),
    ],
  );
}
