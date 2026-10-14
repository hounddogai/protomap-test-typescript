import * as text from "../../../../kit/text.js";
import { AdaptiveProofDraft } from "./adaptive-proof-draft.js";

/** A rule a adaptive proof draft must pass. Check returns its problems, or none. */
export interface AdaptiveProofDraftRule {
  check(item: AdaptiveProofDraft): string[];
}

export class AdaptiveProofDraftNameLengthRule implements AdaptiveProofDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveProofDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveProofDraftAllowedNameRule implements AdaptiveProofDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveProofDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class AdaptiveProofDraftRequiredNameRule implements AdaptiveProofDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveProofDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive proof draft. */
export class AdaptiveProofDraftValidator {
  rules: AdaptiveProofDraftRule[];

  constructor(rules: AdaptiveProofDraftRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveProofDraft): string[] {
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

  requireValid(item: AdaptiveProofDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveProofDraft[]): Map<string, string[]> {
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

export function defaultAdaptiveProofDraftValidator(): AdaptiveProofDraftValidator {
  return new AdaptiveProofDraftValidator(
    [
      new AdaptiveProofDraftNameLengthRule(1000),
      new AdaptiveProofDraftAllowedNameRule(["fallback", "global"]),
      new AdaptiveProofDraftRequiredNameRule("adaptive proof draft needs a value"),
    ],
  );
}
