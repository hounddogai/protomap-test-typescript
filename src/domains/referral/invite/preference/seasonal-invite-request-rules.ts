import { SeasonalInviteRequest } from "./seasonal-invite-request.js";

/** A rule a seasonal invite request must pass. Check returns its problems, or none. */
export interface SeasonalInviteRequestRule {
  check(item: SeasonalInviteRequest): string[];
}

export class SeasonalInviteRequestRequiredTitleRule implements SeasonalInviteRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInviteRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalInviteRequestTitleLengthRule implements SeasonalInviteRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInviteRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInviteRequestNameLengthRule implements SeasonalInviteRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalInviteRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalInviteRequestRequiredNameRule implements SeasonalInviteRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInviteRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalInviteRequestCodePrefixRule implements SeasonalInviteRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalInviteRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalInviteRequestRequiredNotesRule implements SeasonalInviteRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInviteRequest): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal invite request. */
export class SeasonalInviteRequestValidator {
  rules: SeasonalInviteRequestRule[];

  constructor(rules: SeasonalInviteRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInviteRequest): string[] {
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

  requireValid(item: SeasonalInviteRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInviteRequest[]): Map<string, string[]> {
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

export function defaultSeasonalInviteRequestValidator(): SeasonalInviteRequestValidator {
  return new SeasonalInviteRequestValidator(
    [
      new SeasonalInviteRequestRequiredTitleRule("seasonal invite request needs an entry"),
      new SeasonalInviteRequestTitleLengthRule(86400),
      new SeasonalInviteRequestNameLengthRule(1000),
      new SeasonalInviteRequestRequiredNameRule("seasonal invite request needs this field"),
      new SeasonalInviteRequestCodePrefixRule("Q"),
      new SeasonalInviteRequestRequiredNotesRule("seasonal invite request needs a value"),
    ],
  );
}
