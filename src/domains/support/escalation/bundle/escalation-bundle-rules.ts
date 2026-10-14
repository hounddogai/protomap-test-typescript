import { EscalationBundle } from "./escalation-bundle.js";

/** A rule a escalation bundle must pass. Check returns its problems, or none. */
export interface EscalationBundleRule {
  check(item: EscalationBundle): string[];
}

export class EscalationBundleRequiredExternalRefRule implements EscalationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationBundle): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationBundleDurationMinutesRangeRule implements EscalationBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationBundle): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationBundleChannelLengthRule implements EscalationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationBundle): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation bundle. */
export class EscalationBundleValidator {
  rules: EscalationBundleRule[];

  constructor(rules: EscalationBundleRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationBundle): string[] {
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

  requireValid(item: EscalationBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationBundle[]): Map<string, string[]> {
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

export function defaultEscalationBundleValidator(): EscalationBundleValidator {
  return new EscalationBundleValidator(
    [
      new EscalationBundleRequiredExternalRefRule("escalation bundle needs a value"),
      new EscalationBundleDurationMinutesRangeRule(255, 1000),
      new EscalationBundleChannelLengthRule(80),
    ],
  );
}
