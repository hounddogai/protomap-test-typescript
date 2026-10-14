import { PreferenceCycle } from "./preference-cycle.js";

/** A rule a preference cycle must pass. Check returns its problems, or none. */
export interface PreferenceCycleRule {
  check(item: PreferenceCycle): string[];
}

export class PreferenceCycleNameLengthRule implements PreferenceCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceCycleRequiredCodeRule implements PreferenceCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceCycleArchivedGuardRule implements PreferenceCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PreferenceCycle): string[] {
    if (item.archived && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PreferenceCycleCodePrefixRule implements PreferenceCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PreferenceCycleCampaignRefLengthRule implements PreferenceCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceCycle): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceCycleRequiredCampaignRefRule implements PreferenceCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceCycle): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference cycle. */
export class PreferenceCycleValidator {
  rules: PreferenceCycleRule[];

  constructor(rules: PreferenceCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceCycle): string[] {
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

  requireValid(item: PreferenceCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceCycle[]): Map<string, string[]> {
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

export function defaultPreferenceCycleValidator(): PreferenceCycleValidator {
  return new PreferenceCycleValidator(
    [
      new PreferenceCycleNameLengthRule(86400),
      new PreferenceCycleRequiredCodeRule("preference cycle needs an entry"),
      new PreferenceCycleArchivedGuardRule(0.8),
      new PreferenceCycleCodePrefixRule("ACM"),
      new PreferenceCycleCampaignRefLengthRule(86400),
      new PreferenceCycleRequiredCampaignRefRule("preference cycle needs an entry"),
    ],
  );
}
