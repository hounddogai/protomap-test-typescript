import { SeasonalEscalationDigest } from "./seasonal-escalation-digest.js";

/** A rule a seasonal escalation digest must pass. Check returns its problems, or none. */
export interface SeasonalEscalationDigestRule {
  check(item: SeasonalEscalationDigest): string[];
}

export class SeasonalEscalationDigestRequiredCodeRule implements SeasonalEscalationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEscalationDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEscalationDigestCodePrefixRule implements SeasonalEscalationDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalEscalationDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalEscalationDigestRequiredNameRule implements SeasonalEscalationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEscalationDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEscalationDigestSegmentLengthRule implements SeasonalEscalationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEscalationDigest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEscalationDigestCodeLengthRule implements SeasonalEscalationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEscalationDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal escalation digest. */
export class SeasonalEscalationDigestValidator {
  rules: SeasonalEscalationDigestRule[];

  constructor(rules: SeasonalEscalationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEscalationDigest): string[] {
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

  requireValid(item: SeasonalEscalationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEscalationDigest[]): Map<string, string[]> {
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

export function defaultSeasonalEscalationDigestValidator(): SeasonalEscalationDigestValidator {
  return new SeasonalEscalationDigestValidator(
    [
      new SeasonalEscalationDigestRequiredCodeRule("seasonal escalation digest needs a value"),
      new SeasonalEscalationDigestCodePrefixRule("X"),
      new SeasonalEscalationDigestRequiredNameRule("seasonal escalation digest needs this field"),
      new SeasonalEscalationDigestSegmentLengthRule(3600),
      new SeasonalEscalationDigestCodeLengthRule(255),
    ],
  );
}
