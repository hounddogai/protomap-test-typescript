import * as text from "../../../../kit/text.js";
import { CappedTouchpointManifest } from "./capped-touchpoint-manifest.js";

/** A rule a capped touchpoint manifest must pass. Check returns its problems, or none. */
export interface CappedTouchpointManifestRule {
  check(item: CappedTouchpointManifest): string[];
}

export class CappedTouchpointManifestChannelLengthRule implements CappedTouchpointManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointManifest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTouchpointManifestAllowedCodeRule implements CappedTouchpointManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedTouchpointManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class CappedTouchpointManifestTitleLengthRule implements CappedTouchpointManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTouchpointManifestCodeLengthRule implements CappedTouchpointManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped touchpoint manifest. */
export class CappedTouchpointManifestValidator {
  rules: CappedTouchpointManifestRule[];

  constructor(rules: CappedTouchpointManifestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTouchpointManifest): string[] {
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

  requireValid(item: CappedTouchpointManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTouchpointManifest[]): Map<string, string[]> {
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

export function defaultCappedTouchpointManifestValidator(): CappedTouchpointManifestValidator {
  return new CappedTouchpointManifestValidator(
    [
      new CappedTouchpointManifestChannelLengthRule(3600),
      new CappedTouchpointManifestAllowedCodeRule(["tiered", "rolling"]),
      new CappedTouchpointManifestTitleLengthRule(86400),
      new CappedTouchpointManifestCodeLengthRule(16),
    ],
  );
}
