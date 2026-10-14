import * as text from "../../../../kit/text.js";

/** Where a domain baseline is in its life cycle. */
export type DomainBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A domain baseline. Its code is unique within a tenant. */
export class DomainBaseline {
  code: string;
  title: string;
  campaignRef: string;
  pinned: boolean;
  notes: string;
  country: string;
  graceDays: number;
  ratio: number;
  batchSize: number;
  status: DomainBaselineStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    pinned: boolean,
    notes: string,
    country: string,
    graceDays: number,
    ratio: number,
    batchSize: number,
    status: DomainBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.notes = notes;
    this.country = country;
    this.graceDays = graceDays;
    this.ratio = ratio;
    this.batchSize = batchSize;
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

  canMoveTo(next: DomainBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DomainBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.batchSize * this.graceDays * 100) / 100;
  }

  copy(): DomainBaseline {
    return new DomainBaseline(
      this.code,
      this.title,
      this.campaignRef,
      this.pinned,
      this.notes,
      this.country,
      this.graceDays,
      this.ratio,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a domain baseline in status proposed. */
export function newDomainBaseline(code: string, title: string): DomainBaseline {
  return new DomainBaseline(code, title, "", false, "", "", 0, 0, 0, "proposed");
}
