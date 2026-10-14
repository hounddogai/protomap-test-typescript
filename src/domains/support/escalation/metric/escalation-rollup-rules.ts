import { EscalationRollup } from "./escalation-rollup.js";

/** A rule a escalation rollup must pass. Check returns its problems, or none. */
export interface EscalationRollupRule {
  check(item: EscalationRollup): string[];
}

export class EscalationRollupNameLengthRule implements EscalationRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationRollupVisibleGuardRule implements EscalationRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EscalationRollup): string[] {
    if (item.visible && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class EscalationRollupDurationMinutesRangeRule implements EscalationRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationRollup): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationRollupRequiredContactEmailRule implements EscalationRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationRollup): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationRollupCodePrefixRule implements EscalationRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationRollupCodeLengthRule implements EscalationRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation rollup. */
export class EscalationRollupValidator {
  rules: EscalationRollupRule[];

  constructor(rules: EscalationRollupRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationRollup[]): Map<string, string[]> {
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

export function defaultEscalationRollupValidator(): EscalationRollupValidator {
  return new EscalationRollupValidator(
    [
      new EscalationRollupNameLengthRule(3600),
      new EscalationRollupVisibleGuardRule(3.3),
      new EscalationRollupDurationMinutesRangeRule(16, 3600),
      new EscalationRollupRequiredContactEmailRule("escalation rollup needs an entry"),
      new EscalationRollupCodePrefixRule("Q"),
      new EscalationRollupCodeLengthRule(32),
    ],
  );
}
