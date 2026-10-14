import { DefaultWarmupThreshold } from "./default-warmup-threshold.js";

/** A rule a default warmup threshold must pass. Check returns its problems, or none. */
export interface DefaultWarmupThresholdRule {
  check(item: DefaultWarmupThreshold): string[];
}

export class DefaultWarmupThresholdChannelLengthRule implements DefaultWarmupThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupThreshold): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupThresholdArchivedGuardRule implements DefaultWarmupThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultWarmupThreshold): string[] {
    if (item.archived && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class DefaultWarmupThresholdRequiredChannelRule implements DefaultWarmupThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupThreshold): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default warmup threshold. */
export class DefaultWarmupThresholdValidator {
  rules: DefaultWarmupThresholdRule[];

  constructor(rules: DefaultWarmupThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWarmupThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultWarmupThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWarmupThreshold[]): Map<string, string[]> {
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

export function defaultDefaultWarmupThresholdValidator(): DefaultWarmupThresholdValidator {
  return new DefaultWarmupThresholdValidator(
    [
      new DefaultWarmupThresholdChannelLengthRule(86400),
      new DefaultWarmupThresholdArchivedGuardRule(7.1),
      new DefaultWarmupThresholdRequiredChannelRule("default warmup threshold needs a value"),
    ],
  );
}
