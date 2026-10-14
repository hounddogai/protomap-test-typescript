import * as text from "../../../../kit/text.js";

/** Where a regional credit slot is in its life cycle. */
export type RegionalCreditSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional credit slot as the credit team keeps it. */
export class RegionalCreditSlot {
  code: string;
  title: string;
  country: string;
  clicks: number;
  campaignRef: string;
  priority: number;
  audienceId: string;
  sequence: number;
  pinned: boolean;
  status: RegionalCreditSlotStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    clicks: number,
    campaignRef: string,
    priority: number,
    audienceId: string,
    sequence: number,
    pinned: boolean,
    status: RegionalCreditSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.priority = priority;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.pinned = pinned;
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

  canMoveTo(next: RegionalCreditSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCreditSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional credit slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.sequence + this.clicks) * 100) / 100;
  }

  copy(): RegionalCreditSlot {
    return new RegionalCreditSlot(
      this.code,
      this.title,
      this.country,
      this.clicks,
      this.campaignRef,
      this.priority,
      this.audienceId,
      this.sequence,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional credit slot in status proposed. */
export function newRegionalCreditSlot(code: string, title: string): RegionalCreditSlot {
  return new RegionalCreditSlot(code, title, "", 0, "", 0, "", 0, false, "proposed");
}
