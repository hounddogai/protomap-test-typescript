import * as text from "../../../../kit/text.js";

/** Where a global frequency proposal is in its life cycle. */
export type GlobalFrequencyProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global frequency proposal as the frequency team keeps it. */
export class GlobalFrequencyProposal {
  code: string;
  title: string;
  attributes: Map<string, string>;
  category: string;
  reviewer: string;
  updatedAt: number;
  ratio: number;
  status: GlobalFrequencyProposalStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    category: string,
    reviewer: string,
    updatedAt: number,
    ratio: number,
    status: GlobalFrequencyProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.category = category;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalFrequencyProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFrequencyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global frequency proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.ratio - this.updatedAt) * 100) / 100;
  }

  copy(): GlobalFrequencyProposal {
    return new GlobalFrequencyProposal(
      this.code,
      this.title,
      this.attributes,
      this.category,
      this.reviewer,
      this.updatedAt,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global frequency proposal in status planned. */
export function newGlobalFrequencyProposal(code: string, title: string): GlobalFrequencyProposal {
  return new GlobalFrequencyProposal(code, title, new Map<string, string>(), "", "", 0, 0, "planned");
}
