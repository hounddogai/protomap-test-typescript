import { ChallengeManifest } from "./challenge-manifest.js";

/** A rule a challenge manifest must pass. Check returns its problems, or none. */
export interface ChallengeManifestRule {
  check(item: ChallengeManifest): string[];
}

export class ChallengeManifestPriorityRangeRule implements ChallengeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeManifest): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeManifestRequiredLabelRule implements ChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeManifestNotesLengthRule implements ChallengeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeManifest): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeManifestRequiredNotesRule implements ChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeManifest): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge manifest. */
export class ChallengeManifestValidator {
  rules: ChallengeManifestRule[];

  constructor(rules: ChallengeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeManifest): string[] {
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

  requireValid(item: ChallengeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeManifest[]): Map<string, string[]> {
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

export function defaultChallengeManifestValidator(): ChallengeManifestValidator {
  return new ChallengeManifestValidator(
    [
      new ChallengeManifestPriorityRangeRule(80, 80),
      new ChallengeManifestRequiredLabelRule("challenge manifest needs an entry"),
      new ChallengeManifestNotesLengthRule(64),
      new ChallengeManifestRequiredNotesRule("challenge manifest needs a value"),
    ],
  );
}
