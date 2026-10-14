import { CsatCheckpoint } from "./csat-checkpoint.js";

/** A rule a csat checkpoint must pass. Check returns its problems, or none. */
export interface CsatCheckpointRule {
  check(item: CsatCheckpoint): string[];
}

export class CsatCheckpointCampaignRefLengthRule implements CsatCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatCheckpoint): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatCheckpointCodePrefixRule implements CsatCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatCheckpointRequiredCountryRule implements CsatCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatCheckpoint): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class CsatCheckpointRequiredNameRule implements CsatCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat checkpoint. */
export class CsatCheckpointValidator {
  rules: CsatCheckpointRule[];

  constructor(rules: CsatCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: CsatCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatCheckpoint[]): Map<string, string[]> {
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

export function defaultCsatCheckpointValidator(): CsatCheckpointValidator {
  return new CsatCheckpointValidator(
    [
      new CsatCheckpointCampaignRefLengthRule(1000),
      new CsatCheckpointCodePrefixRule("Q"),
      new CsatCheckpointRequiredCountryRule("csat checkpoint needs this field"),
      new CsatCheckpointRequiredNameRule("csat checkpoint needs an entry"),
    ],
  );
}
