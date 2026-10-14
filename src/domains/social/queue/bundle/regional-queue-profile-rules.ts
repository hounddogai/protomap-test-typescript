import { RegionalQueueProfile } from "./regional-queue-profile.js";

/** A rule a regional queue profile must pass. Check returns its problems, or none. */
export interface RegionalQueueProfileRule {
  check(item: RegionalQueueProfile): string[];
}

export class RegionalQueueProfileRequiredNameRule implements RegionalQueueProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueueProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalQueueProfileCodePrefixRule implements RegionalQueueProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalQueueProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalQueueProfileVisibleGuardRule implements RegionalQueueProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalQueueProfile): string[] {
    if (item.visible && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RegionalQueueProfileCodeLengthRule implements RegionalQueueProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalQueueProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional queue profile. */
export class RegionalQueueProfileValidator {
  rules: RegionalQueueProfileRule[];

  constructor(rules: RegionalQueueProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalQueueProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalQueueProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalQueueProfile[]): Map<string, string[]> {
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

export function defaultRegionalQueueProfileValidator(): RegionalQueueProfileValidator {
  return new RegionalQueueProfileValidator(
    [
      new RegionalQueueProfileRequiredNameRule("regional queue profile needs an entry"),
      new RegionalQueueProfileCodePrefixRule("X"),
      new RegionalQueueProfileVisibleGuardRule(255),
      new RegionalQueueProfileCodeLengthRule(1000),
    ],
  );
}
