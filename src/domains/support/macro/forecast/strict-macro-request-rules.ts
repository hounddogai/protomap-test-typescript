import { StrictMacroRequest } from "./strict-macro-request.js";

/** A rule a strict macro request must pass. Check returns its problems, or none. */
export interface StrictMacroRequestRule {
  check(item: StrictMacroRequest): string[];
}

export class StrictMacroRequestAudienceIdLengthRule implements StrictMacroRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictMacroRequest): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictMacroRequestRequiredTitleRule implements StrictMacroRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictMacroRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictMacroRequestPinnedGuardRule implements StrictMacroRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictMacroRequest): string[] {
    if (item.pinned && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class StrictMacroRequestCodePrefixRule implements StrictMacroRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictMacroRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict macro request. */
export class StrictMacroRequestValidator {
  rules: StrictMacroRequestRule[];

  constructor(rules: StrictMacroRequestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictMacroRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictMacroRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictMacroRequest[]): Map<string, string[]> {
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

export function defaultStrictMacroRequestValidator(): StrictMacroRequestValidator {
  return new StrictMacroRequestValidator(
    [
      new StrictMacroRequestAudienceIdLengthRule(16),
      new StrictMacroRequestRequiredTitleRule("strict macro request needs this field"),
      new StrictMacroRequestPinnedGuardRule(8.6),
      new StrictMacroRequestCodePrefixRule("REF"),
    ],
  );
}
