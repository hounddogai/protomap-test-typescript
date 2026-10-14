import * as text from "../../../../kit/text.js";

/** Where a challenge proposal is in its life cycle. */
export type ChallengeProposalStatus = "created" | "validated" | "published" | "retired";

/** One challenge proposal, with what the planners need to act on it. */
export class ChallengeProposal {
  code: string;
  label: string;
  title: string;
  attempts: number;
  score: number;
  tags: string[];
  description: string;
  segment: string;
  status: ChallengeProposalStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    attempts: number,
    score: number,
    tags: string[],
    description: string,
    segment: string,
    status: ChallengeProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.attempts = attempts;
    this.score = score;
    this.tags = tags;
    this.description = description;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ChallengeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.score + this.attempts) * 100) / 100;
  }

  copy(): ChallengeProposal {
    return new ChallengeProposal(
      this.code,
      this.label,
      this.title,
      this.attempts,
      this.score,
      this.tags,
      this.description,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a challenge proposal in status created. */
export function newChallengeProposal(code: string, label: string): ChallengeProposal {
  return new ChallengeProposal(code, label, "", 0, 0, [], "", "", "created");
}
