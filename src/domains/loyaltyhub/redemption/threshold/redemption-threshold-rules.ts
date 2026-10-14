import { RedemptionThreshold } from "./redemption-threshold.js";

/** A rule a redemption threshold must pass. Check returns its problems, or none. */
export interface RedemptionThresholdRule {
  check(item: RedemptionThreshold): string[];
}

export class RedemptionThresholdRequiredCodeRule implements RedemptionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionThresholdCodePrefixRule implements RedemptionThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionThresholdJourneyIdLengthRule implements RedemptionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionThreshold): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption threshold. */
export class RedemptionThresholdValidator {
  rules: RedemptionThresholdRule[];

  constructor(rules: RedemptionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionThreshold): string[] {
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

  requireValid(item: RedemptionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionThreshold[]): Map<string, string[]> {
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

export function defaultRedemptionThresholdValidator(): RedemptionThresholdValidator {
  return new RedemptionThresholdValidator(
    [
      new RedemptionThresholdRequiredCodeRule("redemption threshold needs an entry"),
      new RedemptionThresholdCodePrefixRule("OPS"),
      new RedemptionThresholdJourneyIdLengthRule(32),
    ],
  );
}
