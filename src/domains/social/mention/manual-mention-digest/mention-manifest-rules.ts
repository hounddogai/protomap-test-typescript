import { MentionManifest } from "./mention-manifest.js";

/** A rule a mention manifest must pass. Check returns its problems, or none. */
export interface MentionManifestRule {
  check(item: MentionManifest): string[];
}

export class MentionManifestRequiredNameRule implements MentionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class MentionManifestCodeLengthRule implements MentionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionManifestDescriptionLengthRule implements MentionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionManifest): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention manifest. */
export class MentionManifestValidator {
  rules: MentionManifestRule[];

  constructor(rules: MentionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: MentionManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionManifest[]): Map<string, string[]> {
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

export function defaultMentionManifestValidator(): MentionManifestValidator {
  return new MentionManifestValidator(
    [
      new MentionManifestRequiredNameRule("mention manifest needs an entry"),
      new MentionManifestCodeLengthRule(86400),
      new MentionManifestDescriptionLengthRule(16),
    ],
  );
}
