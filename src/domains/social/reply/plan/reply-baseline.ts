import * as text from "../../../../kit/text.js";

/** Where a reply baseline is in its life cycle. */
export type ReplyBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reply baseline. Its code is unique within a tenant. */
export class ReplyBaseline {
  code: string;
  label: string;
  revision: number;
  name: string;
  campaignRef: string;
  capacity: number;
  contactEmail: string;
  weight: number;
  source: string;
  cost: number;
  cohort: string;
  status: ReplyBaselineStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    name: string,
    campaignRef: string,
    capacity: number,
    contactEmail: string,
    weight: number,
    source: string,
    cost: number,
    cohort: string,
    status: ReplyBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.name = name;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.source = source;
    this.cost = cost;
    this.cohort = cohort;
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

  canMoveTo(next: ReplyBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: ReplyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"reply baseline"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.weight - this.cost) * 100) / 100;
  }

  copy(): ReplyBaseline {
    return new ReplyBaseline(
      this.code,
      this.label,
      this.revision,
      this.name,
      this.campaignRef,
      this.capacity,
      this.contactEmail,
      this.weight,
      this.source,
      this.cost,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reply baseline in status draft. */
export function newReplyBaseline(code: string, label: string): ReplyBaseline {
  return new ReplyBaseline(code, label, 0, "", "", 0, "", 0, "", 0, "", "draft");
}
