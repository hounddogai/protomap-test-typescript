import * as text from "../../../../kit/text.js";
import { InviteManifest } from "./invite-manifest.js";

/** A rule a invite manifest must pass. Check returns its problems, or none. */
export interface InviteManifestRule {
  check(item: InviteManifest): string[];
}

export class InviteManifestCodeLengthRule implements InviteManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteManifestTitleLengthRule implements InviteManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteManifestAllowedNameRule implements InviteManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class InviteManifestRequiredTitleRule implements InviteManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InviteManifestNameLengthRule implements InviteManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite manifest. */
export class InviteManifestValidator {
  rules: InviteManifestRule[];

  constructor(rules: InviteManifestRule[]) {
    this.rules = rules;
  }

  validate(item: InviteManifest): string[] {
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

  requireValid(item: InviteManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteManifest[]): Map<string, string[]> {
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

export function defaultInviteManifestValidator(): InviteManifestValidator {
  return new InviteManifestValidator(
    [
      new InviteManifestCodeLengthRule(86400),
      new InviteManifestTitleLengthRule(1000),
      new InviteManifestAllowedNameRule([]),
      new InviteManifestRequiredTitleRule("invite manifest needs a value"),
      new InviteManifestNameLengthRule(255),
    ],
  );
}
