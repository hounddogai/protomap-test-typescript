import { SeasonalEscalationRollup } from "./seasonal-escalation-rollup.js";

/** A rule a seasonal escalation rollup must pass. Check returns its problems, or none. */
export interface SeasonalEscalationRollupRule {
  check(item: SeasonalEscalationRollup): string[];
}

export class SeasonalEscalationRollupRequiredCurrencyRule implements SeasonalEscalationRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEscalationRollup): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEscalationRollupTitleLengthRule implements SeasonalEscalationRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEscalationRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEscalationRollupCodeLengthRule implements SeasonalEscalationRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEscalationRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEscalationRollupCodePrefixRule implements SeasonalEscalationRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalEscalationRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal escalation rollup. */
export class SeasonalEscalationRollupValidator {
  rules: SeasonalEscalationRollupRule[];

  constructor(rules: SeasonalEscalationRollupRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEscalationRollup): string[] {
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

  requireValid(item: SeasonalEscalationRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEscalationRollup[]): Map<string, string[]> {
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

export function defaultSeasonalEscalationRollupValidator(): SeasonalEscalationRollupValidator {
  return new SeasonalEscalationRollupValidator(
    [
      new SeasonalEscalationRollupRequiredCurrencyRule("seasonal escalation rollup needs a value"),
      new SeasonalEscalationRollupTitleLengthRule(86400),
      new SeasonalEscalationRollupCodeLengthRule(64),
      new SeasonalEscalationRollupCodePrefixRule("REF"),
    ],
  );
}
