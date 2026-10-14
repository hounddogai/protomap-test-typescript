import * as text from "../../../../kit/text.js";

/** Where a strict placement slot is in its life cycle. */
export type StrictPlacementSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One strict placement slot, with what the planners need to act on it. */
export class StrictPlacementSlot {
  code: string;
  name: string;
  summary: string;
  budget: number;
  score: number;
  minimum: number;
  campaignRef: string;
  status: StrictPlacementSlotStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    budget: number,
    score: number,
    minimum: number,
    campaignRef: string,
    status: StrictPlacementSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.budget = budget;
    this.score = score;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPlacementSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict placement slot"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.minimum + this.score) * 100) / 100;
  }

  copy(): StrictPlacementSlot {
    return new StrictPlacementSlot(
      this.code,
      this.name,
      this.summary,
      this.budget,
      this.score,
      this.minimum,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict placement slot in status draft. */
export function newStrictPlacementSlot(code: string, name: string): StrictPlacementSlot {
  return new StrictPlacementSlot(code, name, "", 0, 0, 0, "", "draft");
}
