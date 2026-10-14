import { ChallengeCycle } from "./challenge-cycle.js";

/** A rule a challenge cycle must pass. Check returns its problems, or none. */
export interface ChallengeCycleRule {
  check(item: ChallengeCycle): string[];
}

export class ChallengeCycleRequiredCodeRule implements ChallengeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeCycleCodePrefixRule implements ChallengeCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeCycleRequiredNotesRule implements ChallengeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeCycle): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeCycleNotesLengthRule implements ChallengeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeCycle): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeCycleNameLengthRule implements ChallengeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge cycle. */
export class ChallengeCycleValidator {
  rules: ChallengeCycleRule[];

  constructor(rules: ChallengeCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeCycle[]): Map<string, string[]> {
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

export function defaultChallengeCycleValidator(): ChallengeCycleValidator {
  return new ChallengeCycleValidator(
    [
      new ChallengeCycleRequiredCodeRule("challenge cycle needs an entry"),
      new ChallengeCycleCodePrefixRule("REF"),
      new ChallengeCycleRequiredNotesRule("challenge cycle needs a value"),
      new ChallengeCycleNotesLengthRule(3600),
      new ChallengeCycleNameLengthRule(1000),
    ],
  );
}
