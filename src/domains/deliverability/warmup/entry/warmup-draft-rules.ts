import { WarmupDraft } from "./warmup-draft.js";

/** A rule a warmup draft must pass. Check returns its problems, or none. */
export interface WarmupDraftRule {
  check(item: WarmupDraft): string[];
}

export class WarmupDraftRequiredChannelRule implements WarmupDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupDraftCodePrefixRule implements WarmupDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupDraftRequiredAudienceIdRule implements WarmupDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupDraft): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup draft. */
export class WarmupDraftValidator {
  rules: WarmupDraftRule[];

  constructor(rules: WarmupDraftRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupDraft): string[] {
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

  requireValid(item: WarmupDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupDraft[]): Map<string, string[]> {
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

export function defaultWarmupDraftValidator(): WarmupDraftValidator {
  return new WarmupDraftValidator(
    [
      new WarmupDraftRequiredChannelRule("warmup draft needs an entry"),
      new WarmupDraftCodePrefixRule("Q"),
      new WarmupDraftRequiredAudienceIdRule("warmup draft needs an entry"),
    ],
  );
}
