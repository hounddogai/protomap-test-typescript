import * as text from "../../../../kit/text.js";
import { GlobalChallengeManifest } from "./global-challenge-manifest.js";

/** A rule a global challenge manifest must pass. Check returns its problems, or none. */
export interface GlobalChallengeManifestRule {
  check(item: GlobalChallengeManifest): string[];
}

export class GlobalChallengeManifestNameLengthRule implements GlobalChallengeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalChallengeManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalChallengeManifestRequiredDescriptionRule implements GlobalChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalChallengeManifest): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalChallengeManifestAllowedLabelRule implements GlobalChallengeManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalChallengeManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class GlobalChallengeManifestRequiredNameRule implements GlobalChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalChallengeManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalChallengeManifestCodePrefixRule implements GlobalChallengeManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalChallengeManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalChallengeManifestCodeLengthRule implements GlobalChallengeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalChallengeManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global challenge manifest. */
export class GlobalChallengeManifestValidator {
  rules: GlobalChallengeManifestRule[];

  constructor(rules: GlobalChallengeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalChallengeManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalChallengeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalChallengeManifest[]): Map<string, string[]> {
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

export function defaultGlobalChallengeManifestValidator(): GlobalChallengeManifestValidator {
  return new GlobalChallengeManifestValidator(
    [
      new GlobalChallengeManifestNameLengthRule(80),
      new GlobalChallengeManifestRequiredDescriptionRule("global challenge manifest needs an entry"),
      new GlobalChallengeManifestAllowedLabelRule(["batched", "primary", "legacy"]),
      new GlobalChallengeManifestRequiredNameRule("global challenge manifest needs an entry"),
      new GlobalChallengeManifestCodePrefixRule("ACM"),
      new GlobalChallengeManifestCodeLengthRule(80),
    ],
  );
}
