import * as text from "../../../../kit/text.js";

/** Where a default frequency estimate is in its life cycle. */
export type DefaultFrequencyEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default frequency estimate as the frequency team keeps it. */
export class DefaultFrequencyEstimate {
  code: string;
  name: string;
  bid: number;
  archived: boolean;
  budget: number;
  checksum: string;
  floorValue: number;
  revision: number;
  ratio: number;
  limit: number;
  sequence: number;
  status: DefaultFrequencyEstimateStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    archived: boolean,
    budget: number,
    checksum: string,
    floorValue: number,
    revision: number,
    ratio: number,
    limit: number,
    sequence: number,
    status: DefaultFrequencyEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.archived = archived;
    this.budget = budget;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.revision = revision;
    this.ratio = ratio;
    this.limit = limit;
    this.sequence = sequence;
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

  canMoveTo(next: DefaultFrequencyEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
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

  moveTo(next: DefaultFrequencyEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default frequency estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.bid + this.revision) * 100) / 100;
  }

  copy(): DefaultFrequencyEstimate {
    return new DefaultFrequencyEstimate(
      this.code,
      this.name,
      this.bid,
      this.archived,
      this.budget,
      this.checksum,
      this.floorValue,
      this.revision,
      this.ratio,
      this.limit,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default frequency estimate in status open. */
export function newDefaultFrequencyEstimate(code: string, name: string): DefaultFrequencyEstimate {
  return new DefaultFrequencyEstimate(code, name, 0, false, 0, "", 0, 0, 0, 0, 0, "open");
}
