import * as text from "../../../../kit/text.js";
import { DefaultChallengeManifest } from "./default-challenge-manifest.js";

/** A rule a default challenge manifest must pass. Check returns its problems, or none. */
export interface DefaultChallengeManifestRule {
  check(item: DefaultChallengeManifest): string[];
}

export class DefaultChallengeManifestAllowedExternalRefRule implements DefaultChallengeManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultChallengeManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is duplicated`];
    return [];
  }
}

export class DefaultChallengeManifestRequiredExternalRefRule implements DefaultChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultChallengeManifest): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultChallengeManifestCodePrefixRule implements DefaultChallengeManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultChallengeManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultChallengeManifestRequiredLabelRule implements DefaultChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultChallengeManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultChallengeManifestCodeLengthRule implements DefaultChallengeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultChallengeManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultChallengeManifestAudienceIdLengthRule implements DefaultChallengeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultChallengeManifest): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default challenge manifest. */
export class DefaultChallengeManifestValidator {
  rules: DefaultChallengeManifestRule[];

  constructor(rules: DefaultChallengeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultChallengeManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultChallengeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultChallengeManifest[]): Map<string, string[]> {
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

export function defaultDefaultChallengeManifestValidator(): DefaultChallengeManifestValidator {
  return new DefaultChallengeManifestValidator(
    [
      new DefaultChallengeManifestAllowedExternalRefRule(["capped", "adaptive"]),
      new DefaultChallengeManifestRequiredExternalRefRule("default challenge manifest needs this field"),
      new DefaultChallengeManifestCodePrefixRule("Q"),
      new DefaultChallengeManifestRequiredLabelRule("default challenge manifest needs an entry"),
      new DefaultChallengeManifestCodeLengthRule(1000),
      new DefaultChallengeManifestAudienceIdLengthRule(80),
    ],
  );
}
