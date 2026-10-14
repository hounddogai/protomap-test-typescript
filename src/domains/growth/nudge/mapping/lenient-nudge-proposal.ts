import * as text from "../../../../kit/text.js";

/** Where a lenient nudge proposal is in its life cycle. */
export type LenientNudgeProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One lenient nudge proposal, with what the planners need to act on it. */
export class LenientNudgeProposal {
  code: string;
  name: string;
  budget: number;
  version: number;
  unit: string;
  campaignRef: string;
  status: LenientNudgeProposalStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    version: number,
    unit: string,
    campaignRef: string,
    status: LenientNudgeProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.version = version;
    this.unit = unit;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: LenientNudgeProposalStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientNudgeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient nudge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round(this.budget * this.version * 100) / 100;
  }

  copy(): LenientNudgeProposal {
    return new LenientNudgeProposal(
      this.code,
      this.name,
      this.budget,
      this.version,
      this.unit,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient nudge proposal in status open. */
export function newLenientNudgeProposal(code: string, name: string): LenientNudgeProposal {
  return new LenientNudgeProposal(code, name, 0, 0, "", "", "open");
}
