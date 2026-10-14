import * as text from "../../../../kit/text.js";

/** Where a regional suppression bundle is in its life cycle. */
export type RegionalSuppressionBundleStatus = "created" | "validated" | "published" | "retired";

/** One regional suppression bundle, with what the planners need to act on it. */
export class RegionalSuppressionBundle {
  code: string;
  title: string;
  durationMinutes: number;
  weight: number;
  cost: number;
  summary: string;
  checksum: string;
  amount: number;
  startsAt: number;
  label: string;
  margin: number;
  status: RegionalSuppressionBundleStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    weight: number,
    cost: number,
    summary: string,
    checksum: string,
    amount: number,
    startsAt: number,
    label: string,
    margin: number,
    status: RegionalSuppressionBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.weight = weight;
    this.cost = cost;
    this.summary = summary;
    this.checksum = checksum;
    this.amount = amount;
    this.startsAt = startsAt;
    this.label = label;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSuppressionBundleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalSuppressionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional suppression bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.amount + this.cost) * 100) / 100;
  }

  copy(): RegionalSuppressionBundle {
    return new RegionalSuppressionBundle(
      this.code,
      this.title,
      this.durationMinutes,
      this.weight,
      this.cost,
      this.summary,
      this.checksum,
      this.amount,
      this.startsAt,
      this.label,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional suppression bundle in status created. */
export function newRegionalSuppressionBundle(code: string, title: string): RegionalSuppressionBundle {
  return new RegionalSuppressionBundle(code, title, 0, 0, 0, "", "", 0, 0, "", 0, "created");
}
