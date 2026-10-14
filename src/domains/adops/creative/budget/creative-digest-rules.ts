import * as text from "../../../../kit/text.js";
import { CreativeDigest } from "./creative-digest.js";

/** A rule a creative digest must pass. Check returns its problems, or none. */
export interface CreativeDigestRule {
  check(item: CreativeDigest): string[];
}

export class CreativeDigestUnitLengthRule implements CreativeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeDigest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeDigestCodeLengthRule implements CreativeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeDigestAllowedChannelRule implements CreativeDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is missing`];
    return [];
  }
}

/** Runs every rule of a creative digest. */
export class CreativeDigestValidator {
  rules: CreativeDigestRule[];

  constructor(rules: CreativeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeDigest[]): Map<string, string[]> {
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

export function defaultCreativeDigestValidator(): CreativeDigestValidator {
  return new CreativeDigestValidator(
    [
      new CreativeDigestUnitLengthRule(255),
      new CreativeDigestCodeLengthRule(86400),
      new CreativeDigestAllowedChannelRule(["legacy", "default"]),
    ],
  );
}
