import * as text from "../../../../kit/text.js";

/** Where a creative override is in its life cycle. */
export type CreativeOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A creative override. Its code is unique within a tenant. */
export class CreativeOverride {
  code: string;
  label: string;
  impressions: number;
  score: number;
  budget: number;
  pinned: boolean;
  archived: boolean;
  active: boolean;
  status: CreativeOverrideStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    score: number,
    budget: number,
    pinned: boolean,
    archived: boolean,
    active: boolean,
    status: CreativeOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.score = score;
    this.budget = budget;
    this.pinned = pinned;
    this.archived = archived;
    this.active = active;
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

  canMoveTo(next: CreativeOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CreativeOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedValue(): number {
    return Math.round(this.impressions * this.score * 100) / 100;
  }

  copy(): CreativeOverride {
    return new CreativeOverride(
      this.code,
      this.label,
      this.impressions,
      this.score,
      this.budget,
      this.pinned,
      this.archived,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a creative override in status draft. */
export function newCreativeOverride(code: string, label: string): CreativeOverride {
  return new CreativeOverride(code, label, 0, 0, 0, false, false, false, "draft");
}
