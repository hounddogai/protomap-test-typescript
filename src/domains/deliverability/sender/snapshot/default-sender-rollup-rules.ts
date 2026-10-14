import * as text from "../../../../kit/text.js";
import { DefaultSenderRollup } from "./default-sender-rollup.js";

/** A rule a default sender rollup must pass. Check returns its problems, or none. */
export interface DefaultSenderRollupRule {
  check(item: DefaultSenderRollup): string[];
}

export class DefaultSenderRollupCodeLengthRule implements DefaultSenderRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSenderRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSenderRollupRequiredCodeRule implements DefaultSenderRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSenderRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSenderRollupRequiredCampaignRefRule implements DefaultSenderRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSenderRollup): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSenderRollupAudienceIdLengthRule implements DefaultSenderRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSenderRollup): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSenderRollupRequiredLabelRule implements DefaultSenderRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSenderRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultSenderRollupAllowedExternalRefRule implements DefaultSenderRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultSenderRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is too long`];
    return [];
  }
}

/** Runs every rule of a default sender rollup. */
export class DefaultSenderRollupValidator {
  rules: DefaultSenderRollupRule[];

  constructor(rules: DefaultSenderRollupRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSenderRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultSenderRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSenderRollup[]): Map<string, string[]> {
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

export function defaultDefaultSenderRollupValidator(): DefaultSenderRollupValidator {
  return new DefaultSenderRollupValidator(
    [
      new DefaultSenderRollupCodeLengthRule(86400),
      new DefaultSenderRollupRequiredCodeRule("default sender rollup needs an entry"),
      new DefaultSenderRollupRequiredCampaignRefRule("default sender rollup needs a value"),
      new DefaultSenderRollupAudienceIdLengthRule(255),
      new DefaultSenderRollupRequiredLabelRule("default sender rollup needs an entry"),
      new DefaultSenderRollupAllowedExternalRefRule(["global"]),
    ],
  );
}
