import * as text from "../../../../kit/text.js";

/** Where a legacy mention group is in its life cycle. */
export type LegacyMentionGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One legacy mention group, with what the planners need to act on it. */
export class LegacyMentionGroup {
  code: string;
  label: string;
  cost: number;
  category: string;
  pinned: boolean;
  ownerId: string;
  name: string;
  minimum: number;
  endsAt: number;
  revision: number;
  bid: number;
  status: LegacyMentionGroupStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    category: string,
    pinned: boolean,
    ownerId: string,
    name: string,
    minimum: number,
    endsAt: number,
    revision: number,
    bid: number,
    status: LegacyMentionGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.category = category;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.name = name;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.revision = revision;
    this.bid = bid;
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

  canMoveTo(next: LegacyMentionGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyMentionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy mention group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round(this.cost * this.bid * 100) / 100;
  }

  copy(): LegacyMentionGroup {
    return new LegacyMentionGroup(
      this.code,
      this.label,
      this.cost,
      this.category,
      this.pinned,
      this.ownerId,
      this.name,
      this.minimum,
      this.endsAt,
      this.revision,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy mention group in status proposed. */
export function newLegacyMentionGroup(code: string, label: string): LegacyMentionGroup {
  return new LegacyMentionGroup(code, label, 0, "", false, "", "", 0, 0, 0, 0, "proposed");
}
