import * as text from "../../../../kit/text.js";

/** Where a weighted invite tier is in its life cycle. */
export type WeightedInviteTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted invite tier as the invite team keeps it. */
export class WeightedInviteTier {
  code: string;
  name: string;
  priority: number;
  tags: string[];
  pinned: boolean;
  budget: number;
  status: WeightedInviteTierStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    tags: string[],
    pinned: boolean,
    budget: number,
    status: WeightedInviteTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.tags = tags;
    this.pinned = pinned;
    this.budget = budget;
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

  canMoveTo(next: WeightedInviteTierStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedInviteTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted invite tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted invite tier"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.priority + this.budget) * 100) / 100;
  }

  copy(): WeightedInviteTier {
    return new WeightedInviteTier(
      this.code,
      this.name,
      this.priority,
      this.tags,
      this.pinned,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted invite tier in status draft. */
export function newWeightedInviteTier(code: string, name: string): WeightedInviteTier {
  return new WeightedInviteTier(code, name, 0, [], false, 0, "draft");
}
