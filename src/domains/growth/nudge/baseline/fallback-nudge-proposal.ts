import * as text from "../../../../kit/text.js";

/** Where a fallback nudge proposal is in its life cycle. */
export type FallbackNudgeProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback nudge proposal. Its code is unique within a tenant. */
export class FallbackNudgeProposal {
  code: string;
  label: string;
  locale: string;
  attributes: Map<string, string>;
  active: boolean;
  budget: number;
  priority: number;
  status: FallbackNudgeProposalStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    attributes: Map<string, string>,
    active: boolean,
    budget: number,
    priority: number,
    status: FallbackNudgeProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.attributes = attributes;
    this.active = active;
    this.budget = budget;
    this.priority = priority;
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

  canMoveTo(next: FallbackNudgeProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackNudgeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback nudge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round(this.budget * this.priority * 100) / 100;
  }

  copy(): FallbackNudgeProposal {
    return new FallbackNudgeProposal(
      this.code,
      this.label,
      this.locale,
      this.attributes,
      this.active,
      this.budget,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback nudge proposal in status open. */
export function newFallbackNudgeProposal(code: string, label: string): FallbackNudgeProposal {
  return new FallbackNudgeProposal(code, label, "", new Map<string, string>(), false, 0, 0, "open");
}
