import { SeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

/** A rule a seasonal double opt in audit must pass. Check returns its problems, or none. */
export interface SeasonalDoubleOptInAuditRule {
  check(item: SeasonalDoubleOptInAudit): string[];
}

export class SeasonalDoubleOptInAuditCodePrefixRule implements SeasonalDoubleOptInAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalDoubleOptInAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalDoubleOptInAuditQuantityRangeRule implements SeasonalDoubleOptInAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDoubleOptInAudit): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalDoubleOptInAuditLabelLengthRule implements SeasonalDoubleOptInAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDoubleOptInAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDoubleOptInAuditChannelLengthRule implements SeasonalDoubleOptInAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDoubleOptInAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDoubleOptInAuditRequiredCodeRule implements SeasonalDoubleOptInAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDoubleOptInAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal double opt in audit. */
export class SeasonalDoubleOptInAuditValidator {
  rules: SeasonalDoubleOptInAuditRule[];

  constructor(rules: SeasonalDoubleOptInAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDoubleOptInAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalDoubleOptInAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDoubleOptInAudit[]): Map<string, string[]> {
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

export function defaultSeasonalDoubleOptInAuditValidator(): SeasonalDoubleOptInAuditValidator {
  return new SeasonalDoubleOptInAuditValidator(
    [
      new SeasonalDoubleOptInAuditCodePrefixRule("REF"),
      new SeasonalDoubleOptInAuditQuantityRangeRule(32, 255),
      new SeasonalDoubleOptInAuditLabelLengthRule(64),
      new SeasonalDoubleOptInAuditChannelLengthRule(16),
      new SeasonalDoubleOptInAuditRequiredCodeRule("seasonal double opt in audit needs a value"),
    ],
  );
}
