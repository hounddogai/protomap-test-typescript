import { OptOutThreshold } from "./opt-out-threshold.js";

/** A rule a opt out threshold must pass. Check returns its problems, or none. */
export interface OptOutThresholdRule {
  check(item: OptOutThreshold): string[];
}

export class OptOutThresholdRequiredChannelRule implements OptOutThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutThreshold): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutThresholdCodePrefixRule implements OptOutThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutThresholdRequiredCodeRule implements OptOutThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out threshold. */
export class OptOutThresholdValidator {
  rules: OptOutThresholdRule[];

  constructor(rules: OptOutThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutThreshold[]): Map<string, string[]> {
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

export function defaultOptOutThresholdValidator(): OptOutThresholdValidator {
  return new OptOutThresholdValidator(
    [
      new OptOutThresholdRequiredChannelRule("opt out threshold needs this field"),
      new OptOutThresholdCodePrefixRule("ACM"),
      new OptOutThresholdRequiredCodeRule("opt out threshold needs this field"),
    ],
  );
}
