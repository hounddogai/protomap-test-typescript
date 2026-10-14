import * as text from "../../../../kit/text.js";

/** Where a adaptive challenge proposal is in its life cycle. */
export type AdaptiveChallengeProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive challenge proposal and its current status. */
export class AdaptiveChallengeProposal {
  code: string;
  name: string;
  tags: string[];
  summary: string;
  durationMinutes: number;
  frequencyCap: number;
  status: AdaptiveChallengeProposalStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    summary: string,
    durationMinutes: number,
    frequencyCap: number,
    status: AdaptiveChallengeProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.summary = summary;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveChallengeProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveChallengeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive challenge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.durationMinutes - this.frequencyCap) * 100) / 100;
  }

  copy(): AdaptiveChallengeProposal {
    return new AdaptiveChallengeProposal(
      this.code,
      this.name,
      this.tags,
      this.summary,
      this.durationMinutes,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive challenge proposal in status proposed. */
export function newAdaptiveChallengeProposal(code: string, name: string): AdaptiveChallengeProposal {
  return new AdaptiveChallengeProposal(code, name, [], "", 0, 0, "proposed");
}
