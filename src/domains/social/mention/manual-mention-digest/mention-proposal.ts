import * as text from "../../../../kit/text.js";

/** Where a mention proposal is in its life cycle. */
export type MentionProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A mention proposal as the mention team keeps it. */
export class MentionProposal {
  code: string;
  label: string;
  graceDays: number;
  variant: string;
  attributes: Map<string, string>;
  locale: string;
  currency: string;
  category: string;
  status: MentionProposalStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    variant: string,
    attributes: Map<string, string>,
    locale: string,
    currency: string,
    category: string,
    status: MentionProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.variant = variant;
    this.attributes = attributes;
    this.locale = locale;
    this.currency = currency;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionProposalStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): MentionProposal {
    return new MentionProposal(
      this.code,
      this.label,
      this.graceDays,
      this.variant,
      this.attributes,
      this.locale,
      this.currency,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a mention proposal in status open. */
export function newMentionProposal(code: string, label: string): MentionProposal {
  return new MentionProposal(code, label, 0, "", new Map<string, string>(), "", "", "", "open");
}
