import { RegionalEscalationScore } from "./regional-escalation-score.js";

/** A rule a regional escalation score must pass. Check returns its problems, or none. */
export interface RegionalEscalationScoreRule {
  check(item: RegionalEscalationScore): string[];
}

export class RegionalEscalationScoreLocaleLengthRule implements RegionalEscalationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEscalationScore): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalEscalationScoreTitleLengthRule implements RegionalEscalationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalEscalationScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalEscalationScoreCodePrefixRule implements RegionalEscalationScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalEscalationScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalEscalationScoreRequiredLocaleRule implements RegionalEscalationScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEscalationScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalEscalationScoreRequiredCodeRule implements RegionalEscalationScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalEscalationScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional escalation score. */
export class RegionalEscalationScoreValidator {
  rules: RegionalEscalationScoreRule[];

  constructor(rules: RegionalEscalationScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalEscalationScore): string[] {
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

  requireValid(item: RegionalEscalationScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalEscalationScore[]): Map<string, string[]> {
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

export function defaultRegionalEscalationScoreValidator(): RegionalEscalationScoreValidator {
  return new RegionalEscalationScoreValidator(
    [
      new RegionalEscalationScoreLocaleLengthRule(32),
      new RegionalEscalationScoreTitleLengthRule(64),
      new RegionalEscalationScoreCodePrefixRule("REF"),
      new RegionalEscalationScoreRequiredLocaleRule("regional escalation score needs an entry"),
      new RegionalEscalationScoreRequiredCodeRule("regional escalation score needs an entry"),
    ],
  );
}
