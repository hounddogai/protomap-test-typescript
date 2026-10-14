import { ManualWaitQuota } from "./manual-wait-quota.js";

/** A rule a manual wait quota must pass. Check returns its problems, or none. */
export interface ManualWaitQuotaRule {
  check(item: ManualWaitQuota): string[];
}

export class ManualWaitQuotaCodePrefixRule implements ManualWaitQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualWaitQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualWaitQuotaNameLengthRule implements ManualWaitQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualWaitQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualWaitQuotaRequiredCodeRule implements ManualWaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWaitQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWaitQuotaChecksumLengthRule implements ManualWaitQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualWaitQuota): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualWaitQuotaRequiredChecksumRule implements ManualWaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWaitQuota): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWaitQuotaPriorityRangeRule implements ManualWaitQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualWaitQuota): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual wait quota. */
export class ManualWaitQuotaValidator {
  rules: ManualWaitQuotaRule[];

  constructor(rules: ManualWaitQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ManualWaitQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualWaitQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualWaitQuota[]): Map<string, string[]> {
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

export function defaultManualWaitQuotaValidator(): ManualWaitQuotaValidator {
  return new ManualWaitQuotaValidator(
    [
      new ManualWaitQuotaCodePrefixRule("REF"),
      new ManualWaitQuotaNameLengthRule(86400),
      new ManualWaitQuotaRequiredCodeRule("manual wait quota needs this field"),
      new ManualWaitQuotaChecksumLengthRule(255),
      new ManualWaitQuotaRequiredChecksumRule("manual wait quota needs a value"),
      new ManualWaitQuotaPriorityRangeRule(80, 86400),
    ],
  );
}
