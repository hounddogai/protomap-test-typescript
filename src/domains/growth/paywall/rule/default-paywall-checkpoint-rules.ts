import { DefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

/** A rule a default paywall checkpoint must pass. Check returns its problems, or none. */
export interface DefaultPaywallCheckpointRule {
  check(item: DefaultPaywallCheckpoint): string[];
}

export class DefaultPaywallCheckpointRequiredLocaleRule implements DefaultPaywallCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallCheckpoint): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPaywallCheckpointRequiredNameRule implements DefaultPaywallCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPaywallCheckpointLocaleLengthRule implements DefaultPaywallCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPaywallCheckpoint): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPaywallCheckpointRequiredUnitRule implements DefaultPaywallCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallCheckpoint): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default paywall checkpoint. */
export class DefaultPaywallCheckpointValidator {
  rules: DefaultPaywallCheckpointRule[];

  constructor(rules: DefaultPaywallCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPaywallCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPaywallCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPaywallCheckpoint[]): Map<string, string[]> {
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

export function defaultDefaultPaywallCheckpointValidator(): DefaultPaywallCheckpointValidator {
  return new DefaultPaywallCheckpointValidator(
    [
      new DefaultPaywallCheckpointRequiredLocaleRule("default paywall checkpoint needs a value"),
      new DefaultPaywallCheckpointRequiredNameRule("default paywall checkpoint needs an entry"),
      new DefaultPaywallCheckpointLocaleLengthRule(86400),
      new DefaultPaywallCheckpointRequiredUnitRule("default paywall checkpoint needs an entry"),
    ],
  );
}
