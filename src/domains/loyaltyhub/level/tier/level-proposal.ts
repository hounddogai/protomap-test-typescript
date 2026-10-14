import * as text from "../../../../kit/text.js";

/** Where a level proposal is in its life cycle. */
export type LevelProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a level proposal and its current status. */
export class LevelProposal {
  code: string;
  label: string;
  rate: number;
  score: number;
  name: string;
  sequence: number;
  ownerId: string;
  attributes: Map<string, string>;
  createdAt: number;
  status: LevelProposalStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    score: number,
    name: string,
    sequence: number,
    ownerId: string,
    attributes: Map<string, string>,
    createdAt: number,
    status: LevelProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.score = score;
    this.name = name;
    this.sequence = sequence;
    this.ownerId = ownerId;
    this.attributes = attributes;
    this.createdAt = createdAt;
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

  canMoveTo(next: LevelProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: LevelProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
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

  effectiveLoad(): number {
    return Math.round((this.sequence - this.score) * 100) / 100;
  }

  copy(): LevelProposal {
    return new LevelProposal(
      this.code,
      this.label,
      this.rate,
      this.score,
      this.name,
      this.sequence,
      this.ownerId,
      this.attributes,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level proposal in status open. */
export function newLevelProposal(code: string, label: string): LevelProposal {
  return new LevelProposal(code, label, 0, 0, "", 0, "", new Map<string, string>(), 0, "open");
}
