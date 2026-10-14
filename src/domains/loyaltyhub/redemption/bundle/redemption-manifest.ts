import * as text from "../../../../kit/text.js";

/** Where a redemption manifest is in its life cycle. */
export type RedemptionManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a redemption manifest and its current status. */
export class RedemptionManifest {
  code: string;
  title: string;
  amount: number;
  openRate: number;
  score: number;
  name: string;
  floorValue: number;
  description: string;
  budget: number;
  phone: string;
  status: RedemptionManifestStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    openRate: number,
    score: number,
    name: string,
    floorValue: number,
    description: string,
    budget: number,
    phone: string,
    status: RedemptionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.openRate = openRate;
    this.score = score;
    this.name = name;
    this.floorValue = floorValue;
    this.description = description;
    this.budget = budget;
    this.phone = phone;
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

  canMoveTo(next: RedemptionManifestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RedemptionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption manifest"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.score + this.openRate) * 100) / 100;
  }

  copy(): RedemptionManifest {
    return new RedemptionManifest(
      this.code,
      this.title,
      this.amount,
      this.openRate,
      this.score,
      this.name,
      this.floorValue,
      this.description,
      this.budget,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a redemption manifest in status open. */
export function newRedemptionManifest(code: string, title: string): RedemptionManifest {
  return new RedemptionManifest(code, title, 0, 0, 0, "", 0, "", 0, "", "open");
}
