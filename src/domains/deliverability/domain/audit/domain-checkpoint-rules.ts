import * as text from "../../../../kit/text.js";
import { DomainCheckpoint } from "./domain-checkpoint.js";

/** A rule a domain checkpoint must pass. Check returns its problems, or none. */
export interface DomainCheckpointRule {
  check(item: DomainCheckpoint): string[];
}

export class DomainCheckpointCodeLengthRule implements DomainCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainCheckpointRequiredCodeRule implements DomainCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainCheckpointNameLengthRule implements DomainCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainCheckpointAllowedCampaignRefRule implements DomainCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is above maximum`];
    return [];
  }
}

/** Runs every rule of a domain checkpoint. */
export class DomainCheckpointValidator {
  rules: DomainCheckpointRule[];

  constructor(rules: DomainCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: DomainCheckpoint): string[] {
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

  requireValid(item: DomainCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainCheckpoint[]): Map<string, string[]> {
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

export function defaultDomainCheckpointValidator(): DomainCheckpointValidator {
  return new DomainCheckpointValidator(
    [
      new DomainCheckpointCodeLengthRule(3600),
      new DomainCheckpointRequiredCodeRule("domain checkpoint needs a value"),
      new DomainCheckpointNameLengthRule(16),
      new DomainCheckpointAllowedCampaignRefRule([]),
    ],
  );
}
