import { SeasonalFunnelRequest } from "./seasonal-funnel-request.js";

/** A rule a seasonal funnel request must pass. Check returns its problems, or none. */
export interface SeasonalFunnelRequestRule {
  check(item: SeasonalFunnelRequest): string[];
}

export class SeasonalFunnelRequestSequenceRangeRule implements SeasonalFunnelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFunnelRequest): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalFunnelRequestRequiredCodeRule implements SeasonalFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFunnelRequestRequiredLocaleRule implements SeasonalFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelRequest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFunnelRequestCodePrefixRule implements SeasonalFunnelRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalFunnelRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalFunnelRequestRequiredNameRule implements SeasonalFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal funnel request. */
export class SeasonalFunnelRequestValidator {
  rules: SeasonalFunnelRequestRule[];

  constructor(rules: SeasonalFunnelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFunnelRequest): string[] {
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

  requireValid(item: SeasonalFunnelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFunnelRequest[]): Map<string, string[]> {
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

export function defaultSeasonalFunnelRequestValidator(): SeasonalFunnelRequestValidator {
  return new SeasonalFunnelRequestValidator(
    [
      new SeasonalFunnelRequestSequenceRangeRule(3600, 3600),
      new SeasonalFunnelRequestRequiredCodeRule("seasonal funnel request needs a value"),
      new SeasonalFunnelRequestRequiredLocaleRule("seasonal funnel request needs a value"),
      new SeasonalFunnelRequestCodePrefixRule("Q"),
      new SeasonalFunnelRequestRequiredNameRule("seasonal funnel request needs an entry"),
    ],
  );
}
