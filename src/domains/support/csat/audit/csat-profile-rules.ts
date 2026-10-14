import { CsatProfile } from "./csat-profile.js";

/** A rule a csat profile must pass. Check returns its problems, or none. */
export interface CsatProfileRule {
  check(item: CsatProfile): string[];
}

export class CsatProfileRequiredNotesRule implements CsatProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatProfile): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CsatProfileChecksumLengthRule implements CsatProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatProfile): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatProfileCodeLengthRule implements CsatProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatProfileNotesLengthRule implements CsatProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatProfile): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatProfileRequiredTitleRule implements CsatProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat profile. */
export class CsatProfileValidator {
  rules: CsatProfileRule[];

  constructor(rules: CsatProfileRule[]) {
    this.rules = rules;
  }

  validate(item: CsatProfile): string[] {
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

  requireValid(item: CsatProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatProfile[]): Map<string, string[]> {
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

export function defaultCsatProfileValidator(): CsatProfileValidator {
  return new CsatProfileValidator(
    [
      new CsatProfileRequiredNotesRule("csat profile needs an entry"),
      new CsatProfileChecksumLengthRule(80),
      new CsatProfileCodeLengthRule(255),
      new CsatProfileNotesLengthRule(3600),
      new CsatProfileRequiredTitleRule("csat profile needs a value"),
    ],
  );
}
