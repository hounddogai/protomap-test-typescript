import { ProofEntry } from "./proof-entry.js";

/** A rule a proof entry must pass. Check returns its problems, or none. */
export interface ProofEntryRule {
  check(item: ProofEntry): string[];
}

export class ProofEntryRequiredUnitRule implements ProofEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofEntry): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ProofEntryCodePrefixRule implements ProofEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofEntryTagsLimitRule implements ProofEntryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ProofEntry): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ProofEntryDiscountRangeRule implements ProofEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofEntry): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofEntryRevisionRangeRule implements ProofEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofEntry): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a proof entry. */
export class ProofEntryValidator {
  rules: ProofEntryRule[];

  constructor(rules: ProofEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ProofEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofEntry[]): Map<string, string[]> {
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

export function defaultProofEntryValidator(): ProofEntryValidator {
  return new ProofEntryValidator(
    [
      new ProofEntryRequiredUnitRule("proof entry needs a value"),
      new ProofEntryCodePrefixRule("X"),
      new ProofEntryTagsLimitRule(32, ["weighted", "scheduled"]),
      new ProofEntryDiscountRangeRule(2, 247.9),
      new ProofEntryRevisionRangeRule(64, 80),
    ],
  );
}
