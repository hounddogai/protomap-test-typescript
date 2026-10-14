import * as text from "../../../../kit/text.js";

/** Where a strict creative estimate is in its life cycle. */
export type StrictCreativeEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict creative estimate as the creative team keeps it. */
export class StrictCreativeEstimate {
  code: string;
  name: string;
  channel: string;
  contactEmail: string;
  country: string;
  amount: number;
  status: StrictCreativeEstimateStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    contactEmail: string,
    country: string,
    amount: number,
    status: StrictCreativeEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.country = country;
    this.amount = amount;
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

  canMoveTo(next: StrictCreativeEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictCreativeEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict creative estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StrictCreativeEstimate {
    return new StrictCreativeEstimate(
      this.code,
      this.name,
      this.channel,
      this.contactEmail,
      this.country,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict creative estimate in status new. */
export function newStrictCreativeEstimate(code: string, name: string): StrictCreativeEstimate {
  return new StrictCreativeEstimate(code, name, "", "", "", 0, "new");
}
