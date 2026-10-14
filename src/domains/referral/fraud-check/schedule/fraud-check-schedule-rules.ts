import * as text from "../../../../kit/text.js";
import { FraudCheckSchedule } from "./fraud-check-schedule.js";

/** A rule a fraud check schedule must pass. Check returns its problems, or none. */
export interface FraudCheckScheduleRule {
  check(item: FraudCheckSchedule): string[];
}

export class FraudCheckScheduleAllowedPhoneRule implements FraudCheckScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is inconsistent`];
    return [];
  }
}

export class FraudCheckSchedulePhoneLengthRule implements FraudCheckScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckSchedule): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckScheduleRequiredAudienceIdRule implements FraudCheckScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckSchedule): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckScheduleCodePrefixRule implements FraudCheckScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckScheduleAudienceIdLengthRule implements FraudCheckScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckSchedule): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check schedule. */
export class FraudCheckScheduleValidator {
  rules: FraudCheckScheduleRule[];

  constructor(rules: FraudCheckScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckSchedule[]): Map<string, string[]> {
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

export function defaultFraudCheckScheduleValidator(): FraudCheckScheduleValidator {
  return new FraudCheckScheduleValidator(
    [
      new FraudCheckScheduleAllowedPhoneRule(["default", "primary", "batched"]),
      new FraudCheckSchedulePhoneLengthRule(16),
      new FraudCheckScheduleRequiredAudienceIdRule("fraud check schedule needs this field"),
      new FraudCheckScheduleCodePrefixRule("ACM"),
      new FraudCheckScheduleAudienceIdLengthRule(86400),
    ],
  );
}
