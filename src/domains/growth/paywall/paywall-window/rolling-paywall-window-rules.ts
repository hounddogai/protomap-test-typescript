import { RollingPaywallWindow } from "./rolling-paywall-window.js";

/** A rule a rolling paywall window must pass. Check returns its problems, or none. */
export interface RollingPaywallWindowRule {
  check(item: RollingPaywallWindow): string[];
}

export class RollingPaywallWindowSendAtRangeRule implements RollingPaywallWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPaywallWindow): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingPaywallWindowRequiredExternalRefRule implements RollingPaywallWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPaywallWindow): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPaywallWindowLabelLengthRule implements RollingPaywallWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPaywallWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPaywallWindowExpiresAtRangeRule implements RollingPaywallWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPaywallWindow): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling paywall window. */
export class RollingPaywallWindowValidator {
  rules: RollingPaywallWindowRule[];

  constructor(rules: RollingPaywallWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPaywallWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPaywallWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPaywallWindow[]): Map<string, string[]> {
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

export function defaultRollingPaywallWindowValidator(): RollingPaywallWindowValidator {
  return new RollingPaywallWindowValidator(
    [
      new RollingPaywallWindowSendAtRangeRule(120, 3600),
      new RollingPaywallWindowRequiredExternalRefRule("rolling paywall window needs this field"),
      new RollingPaywallWindowLabelLengthRule(16),
      new RollingPaywallWindowExpiresAtRangeRule(16, 3600),
    ],
  );
}
