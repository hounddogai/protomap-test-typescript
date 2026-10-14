import * as text from "../../../../kit/text.js";

/** Where a tier item is in its life cycle. */
export type TierItemStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tier item as the tier team keeps it. */
export class TierItem {
  code: string;
  name: string;
  budget: number;
  region: string;
  unit: string;
  tags: string[];
  label: string;
  openRate: number;
  approved: boolean;
  audienceId: string;
  status: TierItemStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    region: string,
    unit: string,
    tags: string[],
    label: string,
    openRate: number,
    approved: boolean,
    audienceId: string,
    status: TierItemStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.region = region;
    this.unit = unit;
    this.tags = tags;
    this.label = label;
    this.openRate = openRate;
    this.approved = approved;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierItemStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.openRate - this.budget) * 100) / 100;
  }

  copy(): TierItem {
    return new TierItem(
      this.code,
      this.name,
      this.budget,
      this.region,
      this.unit,
      this.tags,
      this.label,
      this.openRate,
      this.approved,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tier item in status new. */
export function newTierItem(code: string, name: string): TierItem {
  return new TierItem(code, name, 0, "", "", [], "", 0, false, "", "new");
}
