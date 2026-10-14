import * as text from "../../../../kit/text.js";

/** Where a regional csat slot is in its life cycle. */
export type RegionalCsatSlotStatus = "created" | "validated" | "published" | "retired";

/** One regional csat slot, with what the planners need to act on it. */
export class RegionalCsatSlot {
  code: string;
  title: string;
  revision: number;
  ratio: number;
  discount: number;
  channel: string;
  journeyId: string;
  summary: string;
  createdAt: number;
  region: string;
  budget: number;
  status: RegionalCsatSlotStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    ratio: number,
    discount: number,
    channel: string,
    journeyId: string,
    summary: string,
    createdAt: number,
    region: string,
    budget: number,
    status: RegionalCsatSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.ratio = ratio;
    this.discount = discount;
    this.channel = channel;
    this.journeyId = journeyId;
    this.summary = summary;
    this.createdAt = createdAt;
    this.region = region;
    this.budget = budget;
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

  canMoveTo(next: RegionalCsatSlotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalCsatSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional csat slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"regional csat slot"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.ratio - this.revision) * 100) / 100;
  }

  copy(): RegionalCsatSlot {
    return new RegionalCsatSlot(
      this.code,
      this.title,
      this.revision,
      this.ratio,
      this.discount,
      this.channel,
      this.journeyId,
      this.summary,
      this.createdAt,
      this.region,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional csat slot in status created. */
export function newRegionalCsatSlot(code: string, title: string): RegionalCsatSlot {
  return new RegionalCsatSlot(code, title, 0, 0, 0, "", "", "", 0, "", 0, "created");
}
