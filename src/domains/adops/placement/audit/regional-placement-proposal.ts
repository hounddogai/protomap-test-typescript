import * as text from "../../../../kit/text.js";

/** Where a regional placement proposal is in its life cycle. */
export type RegionalPlacementProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional placement proposal as the placement team keeps it. */
export class RegionalPlacementProposal {
  code: string;
  label: string;
  utmSource: string;
  attributes: Map<string, string>;
  visible: boolean;
  createdAt: number;
  unit: string;
  segment: string;
  pinned: boolean;
  discount: number;
  budget: number;
  status: RegionalPlacementProposalStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    attributes: Map<string, string>,
    visible: boolean,
    createdAt: number,
    unit: string,
    segment: string,
    pinned: boolean,
    discount: number,
    budget: number,
    status: RegionalPlacementProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.visible = visible;
    this.createdAt = createdAt;
    this.unit = unit;
    this.segment = segment;
    this.pinned = pinned;
    this.discount = discount;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPlacementProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPlacementProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional placement proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
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

  projectedExposure(): number {
    return Math.round((this.discount + this.createdAt) * 100) / 100;
  }

  copy(): RegionalPlacementProposal {
    return new RegionalPlacementProposal(
      this.code,
      this.label,
      this.utmSource,
      this.attributes,
      this.visible,
      this.createdAt,
      this.unit,
      this.segment,
      this.pinned,
      this.discount,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional placement proposal in status idle. */
export function newRegionalPlacementProposal(code: string, label: string): RegionalPlacementProposal {
  return new RegionalPlacementProposal(
    code,
    label,
    "",
    new Map<string, string>(),
    false,
    0,
    "",
    "",
    false,
    0,
    0,
    "idle",
  );
}
