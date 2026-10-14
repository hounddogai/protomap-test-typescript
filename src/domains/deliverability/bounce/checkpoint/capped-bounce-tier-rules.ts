import * as text from "../../../../kit/text.js";
import { CappedBounceTier } from "./capped-bounce-tier.js";

/** A rule a capped bounce tier must pass. Check returns its problems, or none. */
export interface CappedBounceTierRule {
  check(item: CappedBounceTier): string[];
}

export class CappedBounceTierNotesLengthRule implements CappedBounceTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBounceTier): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBounceTierRequiredNotesRule implements CappedBounceTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBounceTier): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBounceTierRequiredAudienceIdRule implements CappedBounceTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBounceTier): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBounceTierRequiredCodeRule implements CappedBounceTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBounceTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBounceTierAllowedContactEmailRule implements CappedBounceTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedBounceTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is too long`];
    return [];
  }
}

/** Runs every rule of a capped bounce tier. */
export class CappedBounceTierValidator {
  rules: CappedBounceTierRule[];

  constructor(rules: CappedBounceTierRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBounceTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedBounceTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBounceTier[]): Map<string, string[]> {
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

export function defaultCappedBounceTierValidator(): CappedBounceTierValidator {
  return new CappedBounceTierValidator(
    [
      new CappedBounceTierNotesLengthRule(120),
      new CappedBounceTierRequiredNotesRule("capped bounce tier needs an entry"),
      new CappedBounceTierRequiredAudienceIdRule("capped bounce tier needs a value"),
      new CappedBounceTierRequiredCodeRule("capped bounce tier needs an entry"),
      new CappedBounceTierAllowedContactEmailRule(["legacy"]),
    ],
  );
}
