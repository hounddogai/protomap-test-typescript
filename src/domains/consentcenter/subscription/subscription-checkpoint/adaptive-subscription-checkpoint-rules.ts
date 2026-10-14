import { AdaptiveSubscriptionCheckpoint } from "./adaptive-subscription-checkpoint.js";

/** A rule a adaptive subscription checkpoint must pass. Check returns its problems, or none. */
export interface AdaptiveSubscriptionCheckpointRule {
  check(item: AdaptiveSubscriptionCheckpoint): string[];
}

export class AdaptiveSubscriptionCheckpointCodeLengthRule implements AdaptiveSubscriptionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSubscriptionCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSubscriptionCheckpointRequiredCodeRule implements AdaptiveSubscriptionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSubscriptionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSubscriptionCheckpointTitleLengthRule implements AdaptiveSubscriptionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSubscriptionCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive subscription checkpoint. */
export class AdaptiveSubscriptionCheckpointValidator {
  rules: AdaptiveSubscriptionCheckpointRule[];

  constructor(rules: AdaptiveSubscriptionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSubscriptionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveSubscriptionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSubscriptionCheckpoint[]): Map<string, string[]> {
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

export function defaultAdaptiveSubscriptionCheckpointValidator(): AdaptiveSubscriptionCheckpointValidator {
  return new AdaptiveSubscriptionCheckpointValidator(
    [
      new AdaptiveSubscriptionCheckpointCodeLengthRule(64),
      new AdaptiveSubscriptionCheckpointRequiredCodeRule("adaptive subscription checkpoint needs a value"),
      new AdaptiveSubscriptionCheckpointTitleLengthRule(64),
    ],
  );
}
