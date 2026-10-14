import { SeasonalWarmupRule } from "./seasonal-warmup-rule.js";

/** A rule a seasonal warmup rule must pass. Check returns its problems, or none. */
export interface SeasonalWarmupRuleRule {
  check(item: SeasonalWarmupRule): string[];
}

export class SeasonalWarmupRuleRequiredNotesRule implements SeasonalWarmupRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupRule): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWarmupRuleCodePrefixRule implements SeasonalWarmupRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalWarmupRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalWarmupRuleRequiredChannelRule implements SeasonalWarmupRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupRule): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal warmup rule. */
export class SeasonalWarmupRuleValidator {
  rules: SeasonalWarmupRuleRule[];

  constructor(rules: SeasonalWarmupRuleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWarmupRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalWarmupRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWarmupRule[]): Map<string, string[]> {
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

export function defaultSeasonalWarmupRuleValidator(): SeasonalWarmupRuleValidator {
  return new SeasonalWarmupRuleValidator(
    [
      new SeasonalWarmupRuleRequiredNotesRule("seasonal warmup rule needs an entry"),
      new SeasonalWarmupRuleCodePrefixRule("REF"),
      new SeasonalWarmupRuleRequiredChannelRule("seasonal warmup rule needs a value"),
    ],
  );
}
