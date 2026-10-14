import { LegacyActivationException } from "./legacy-activation-exception.js";

/** A rule a legacy activation exception must pass. Check returns its problems, or none. */
export interface LegacyActivationExceptionRule {
  check(item: LegacyActivationException): string[];
}

export class LegacyActivationExceptionRequiredCodeRule implements LegacyActivationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyActivationException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyActivationExceptionRequiredNameRule implements LegacyActivationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyActivationException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyActivationExceptionQuantityRangeRule implements LegacyActivationExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyActivationException): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyActivationExceptionNameLengthRule implements LegacyActivationExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyActivationException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyActivationExceptionRequiredCampaignRefRule implements LegacyActivationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyActivationException): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy activation exception. */
export class LegacyActivationExceptionValidator {
  rules: LegacyActivationExceptionRule[];

  constructor(rules: LegacyActivationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyActivationException): string[] {
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

  requireValid(item: LegacyActivationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyActivationException[]): Map<string, string[]> {
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

export function defaultLegacyActivationExceptionValidator(): LegacyActivationExceptionValidator {
  return new LegacyActivationExceptionValidator(
    [
      new LegacyActivationExceptionRequiredCodeRule("legacy activation exception needs a value"),
      new LegacyActivationExceptionRequiredNameRule("legacy activation exception needs an entry"),
      new LegacyActivationExceptionQuantityRangeRule(16, 86400),
      new LegacyActivationExceptionNameLengthRule(32),
      new LegacyActivationExceptionRequiredCampaignRefRule("legacy activation exception needs this field"),
    ],
  );
}
