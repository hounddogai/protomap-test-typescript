import * as text from "../../../../kit/text.js";

/** Where a tiered touchpoint proposal is in its life cycle. */
export type TieredTouchpointProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tiered touchpoint proposal and its current status. */
export class TieredTouchpointProposal {
  code: string;
  name: string;
  archived: boolean;
  tags: string[];
  variant: string;
  approved: boolean;
  segment: string;
  version: number;
  channel: string;
  checksum: string;
  minimum: number;
  status: TieredTouchpointProposalStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    tags: string[],
    variant: string,
    approved: boolean,
    segment: string,
    version: number,
    channel: string,
    checksum: string,
    minimum: number,
    status: TieredTouchpointProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.tags = tags;
    this.variant = variant;
    this.approved = approved;
    this.segment = segment;
    this.version = version;
    this.channel = channel;
    this.checksum = checksum;
    this.minimum = minimum;
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

  canMoveTo(next: TieredTouchpointProposalStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
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

  moveTo(next: TieredTouchpointProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered touchpoint proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.minimum + this.version) * 100) / 100;
  }

  copy(): TieredTouchpointProposal {
    return new TieredTouchpointProposal(
      this.code,
      this.name,
      this.archived,
      this.tags,
      this.variant,
      this.approved,
      this.segment,
      this.version,
      this.channel,
      this.checksum,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered touchpoint proposal in status open. */
export function newTieredTouchpointProposal(code: string, name: string): TieredTouchpointProposal {
  return new TieredTouchpointProposal(code, name, false, [], "", false, "", 0, "", "", 0, "open");
}
