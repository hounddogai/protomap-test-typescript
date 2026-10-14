import * as text from "../../../../kit/text.js";

/** Where a placement proposal is in its life cycle. */
export type PlacementProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One placement proposal, with what the planners need to act on it. */
export class PlacementProposal {
  code: string;
  title: string;
  sequence: number;
  priority: number;
  capacity: number;
  openRate: number;
  description: string;
  retries: number;
  revision: number;
  status: PlacementProposalStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    priority: number,
    capacity: number,
    openRate: number,
    description: string,
    retries: number,
    revision: number,
    status: PlacementProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.priority = priority;
    this.capacity = capacity;
    this.openRate = openRate;
    this.description = description;
    this.retries = retries;
    this.revision = revision;
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

  canMoveTo(next: PlacementProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.revision * this.sequence * 100) / 100;
  }

  copy(): PlacementProposal {
    return new PlacementProposal(
      this.code,
      this.title,
      this.sequence,
      this.priority,
      this.capacity,
      this.openRate,
      this.description,
      this.retries,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a placement proposal in status proposed. */
export function newPlacementProposal(code: string, title: string): PlacementProposal {
  return new PlacementProposal(code, title, 0, 0, 0, 0, "", 0, 0, "proposed");
}
