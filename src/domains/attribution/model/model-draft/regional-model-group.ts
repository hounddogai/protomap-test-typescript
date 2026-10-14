import * as text from "../../../../kit/text.js";

/** Where a regional model group is in its life cycle. */
export type RegionalModelGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional model group as the model team keeps it. */
export class RegionalModelGroup {
  code: string;
  title: string;
  bid: number;
  weight: number;
  name: string;
  openRate: number;
  ownerId: string;
  status: RegionalModelGroupStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    weight: number,
    name: string,
    openRate: number,
    ownerId: string,
    status: RegionalModelGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.weight = weight;
    this.name = name;
    this.openRate = openRate;
    this.ownerId = ownerId;
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

  canMoveTo(next: RegionalModelGroupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalModelGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional model group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedTotal(): number {
    return Math.round((this.bid - this.weight) * 100) / 100;
  }

  copy(): RegionalModelGroup {
    return new RegionalModelGroup(
      this.code,
      this.title,
      this.bid,
      this.weight,
      this.name,
      this.openRate,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional model group in status open. */
export function newRegionalModelGroup(code: string, title: string): RegionalModelGroup {
  return new RegionalModelGroup(code, title, 0, 0, "", 0, "", "open");
}
