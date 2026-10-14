import * as text from "../../../../kit/text.js";

/** Where a weighted retention group is in its life cycle. */
export type WeightedRetentionGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One weighted retention group, with what the planners need to act on it. */
export class WeightedRetentionGroup {
  code: string;
  name: string;
  checksum: string;
  ratio: number;
  capacity: number;
  limit: number;
  score: number;
  startsAt: number;
  notes: string;
  pinned: boolean;
  frequencyCap: number;
  status: WeightedRetentionGroupStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    ratio: number,
    capacity: number,
    limit: number,
    score: number,
    startsAt: number,
    notes: string,
    pinned: boolean,
    frequencyCap: number,
    status: WeightedRetentionGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.ratio = ratio;
    this.capacity = capacity;
    this.limit = limit;
    this.score = score;
    this.startsAt = startsAt;
    this.notes = notes;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: WeightedRetentionGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRetentionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted retention group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.frequencyCap - this.ratio) * 100) / 100;
  }

  copy(): WeightedRetentionGroup {
    return new WeightedRetentionGroup(
      this.code,
      this.name,
      this.checksum,
      this.ratio,
      this.capacity,
      this.limit,
      this.score,
      this.startsAt,
      this.notes,
      this.pinned,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted retention group in status draft. */
export function newWeightedRetentionGroup(code: string, name: string): WeightedRetentionGroup {
  return new WeightedRetentionGroup(code, name, "", 0, 0, 0, 0, 0, "", false, 0, "draft");
}
