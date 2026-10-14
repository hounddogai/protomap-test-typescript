import * as text from "../../../../kit/text.js";

/** Where a primary journey proposal is in its life cycle. */
export type PrimaryJourneyProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary journey proposal and its current status. */
export class PrimaryJourneyProposal {
  code: string;
  name: string;
  limit: number;
  region: string;
  source: string;
  threshold: number;
  priority: number;
  capacity: number;
  floorValue: number;
  status: PrimaryJourneyProposalStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    region: string,
    source: string,
    threshold: number,
    priority: number,
    capacity: number,
    floorValue: number,
    status: PrimaryJourneyProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.region = region;
    this.source = source;
    this.threshold = threshold;
    this.priority = priority;
    this.capacity = capacity;
    this.floorValue = floorValue;
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

  canMoveTo(next: PrimaryJourneyProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimaryJourneyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary journey proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round((this.capacity + this.limit) * 100) / 100;
  }

  copy(): PrimaryJourneyProposal {
    return new PrimaryJourneyProposal(
      this.code,
      this.name,
      this.limit,
      this.region,
      this.source,
      this.threshold,
      this.priority,
      this.capacity,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary journey proposal in status planned. */
export function newPrimaryJourneyProposal(code: string, name: string): PrimaryJourneyProposal {
  return new PrimaryJourneyProposal(code, name, 0, "", "", 0, 0, 0, 0, "planned");
}
