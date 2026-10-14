import * as text from "../../../../kit/text.js";

/** Where a rolling sla baseline is in its life cycle. */
export type RollingSlaBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling sla baseline. Its code is unique within a tenant. */
export class RollingSlaBaseline {
  code: string;
  name: string;
  amount: number;
  openRate: number;
  campaignRef: string;
  title: string;
  capacity: number;
  tags: string[];
  contactEmail: string;
  status: RollingSlaBaselineStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    openRate: number,
    campaignRef: string,
    title: string,
    capacity: number,
    tags: string[],
    contactEmail: string,
    status: RollingSlaBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.title = title;
    this.capacity = capacity;
    this.tags = tags;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: RollingSlaBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingSlaBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sla baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling sla baseline"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round(this.openRate * this.capacity * 100) / 100;
  }

  copy(): RollingSlaBaseline {
    return new RollingSlaBaseline(
      this.code,
      this.name,
      this.amount,
      this.openRate,
      this.campaignRef,
      this.title,
      this.capacity,
      this.tags,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling sla baseline in status proposed. */
export function newRollingSlaBaseline(code: string, name: string): RollingSlaBaseline {
  return new RollingSlaBaseline(code, name, 0, 0, "", "", 0, [], "", "proposed");
}
