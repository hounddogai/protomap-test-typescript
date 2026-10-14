import { AdaptiveDomainGroup } from "./adaptive-domain-group.js";

/** A rule a adaptive domain group must pass. Check returns its problems, or none. */
export interface AdaptiveDomainGroupRule {
  check(item: AdaptiveDomainGroup): string[];
}

export class AdaptiveDomainGroupRequiredTitleRule implements AdaptiveDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainGroupRequiredCodeRule implements AdaptiveDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainGroupRequiredExternalRefRule implements AdaptiveDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainGroup): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainGroupExternalRefLengthRule implements AdaptiveDomainGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainGroup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive domain group. */
export class AdaptiveDomainGroupValidator {
  rules: AdaptiveDomainGroupRule[];

  constructor(rules: AdaptiveDomainGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDomainGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveDomainGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDomainGroup[]): Map<string, string[]> {
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

export function defaultAdaptiveDomainGroupValidator(): AdaptiveDomainGroupValidator {
  return new AdaptiveDomainGroupValidator(
    [
      new AdaptiveDomainGroupRequiredTitleRule("adaptive domain group needs this field"),
      new AdaptiveDomainGroupRequiredCodeRule("adaptive domain group needs an entry"),
      new AdaptiveDomainGroupRequiredExternalRefRule("adaptive domain group needs a value"),
      new AdaptiveDomainGroupExternalRefLengthRule(86400),
    ],
  );
}
