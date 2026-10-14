import * as text from "../../../../kit/text.js";

/** Where a seasonal step draft is in its life cycle. */
export type SeasonalStepDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal step draft as the step team keeps it. */
export class SeasonalStepDraft {
  code: string;
  name: string;
  journeyId: string;
  bid: number;
  capacity: number;
  status: SeasonalStepDraftStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    bid: number,
    capacity: number,
    status: SeasonalStepDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.bid = bid;
    this.capacity = capacity;
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

  canMoveTo(next: SeasonalStepDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalStepDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal step draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal step draft"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.bid * this.capacity * 100) / 100;
  }

  copy(): SeasonalStepDraft {
    return new SeasonalStepDraft(this.code, this.name, this.journeyId, this.bid, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal step draft in status planned. */
export function newSeasonalStepDraft(code: string, name: string): SeasonalStepDraft {
  return new SeasonalStepDraft(code, name, "", 0, 0, "planned");
}
