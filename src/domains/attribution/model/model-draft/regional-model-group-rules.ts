import { RegionalModelGroup } from "./regional-model-group.js";

/** A rule a regional model group must pass. Check returns its problems, or none. */
export interface RegionalModelGroupRule {
  check(item: RegionalModelGroup): string[];
}

export class RegionalModelGroupOwnerIdLengthRule implements RegionalModelGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalModelGroup): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalModelGroupRequiredTitleRule implements RegionalModelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalModelGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalModelGroupNameLengthRule implements RegionalModelGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalModelGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalModelGroupTitleLengthRule implements RegionalModelGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalModelGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalModelGroupCodePrefixRule implements RegionalModelGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalModelGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalModelGroupRequiredOwnerIdRule implements RegionalModelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalModelGroup): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional model group. */
export class RegionalModelGroupValidator {
  rules: RegionalModelGroupRule[];

  constructor(rules: RegionalModelGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalModelGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalModelGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalModelGroup[]): Map<string, string[]> {
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

export function defaultRegionalModelGroupValidator(): RegionalModelGroupValidator {
  return new RegionalModelGroupValidator(
    [
      new RegionalModelGroupOwnerIdLengthRule(1000),
      new RegionalModelGroupRequiredTitleRule("regional model group needs this field"),
      new RegionalModelGroupNameLengthRule(86400),
      new RegionalModelGroupTitleLengthRule(3600),
      new RegionalModelGroupCodePrefixRule("Q"),
      new RegionalModelGroupRequiredOwnerIdRule("regional model group needs this field"),
    ],
  );
}
