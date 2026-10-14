import * as text from "../../../../kit/text.js";
import { RollingNudgeProposal } from "./rolling-nudge-proposal.js";

/** A rule a rolling nudge proposal must pass. Check returns its problems, or none. */
export interface RollingNudgeProposalRule {
  check(item: RollingNudgeProposal): string[];
}

export class RollingNudgeProposalRequiredUtmSourceRule implements RollingNudgeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeProposal): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgeProposalJourneyIdLengthRule implements RollingNudgeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeProposal): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeProposalTagsLimitRule implements RollingNudgeProposalRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingNudgeProposal): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class RollingNudgeProposalAllowedTitleRule implements RollingNudgeProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingNudgeProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class RollingNudgeProposalClicksRangeRule implements RollingNudgeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeProposal): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling nudge proposal. */
export class RollingNudgeProposalValidator {
  rules: RollingNudgeProposalRule[];

  constructor(rules: RollingNudgeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeProposal): string[] {
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

  requireValid(item: RollingNudgeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeProposal[]): Map<string, string[]> {
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

export function defaultRollingNudgeProposalValidator(): RollingNudgeProposalValidator {
  return new RollingNudgeProposalValidator(
    [
      new RollingNudgeProposalRequiredUtmSourceRule("rolling nudge proposal needs this field"),
      new RollingNudgeProposalJourneyIdLengthRule(3600),
      new RollingNudgeProposalTagsLimitRule(120, ["pending"]),
      new RollingNudgeProposalAllowedTitleRule(["weighted", "legacy"]),
      new RollingNudgeProposalClicksRangeRule(80, 120),
    ],
  );
}
