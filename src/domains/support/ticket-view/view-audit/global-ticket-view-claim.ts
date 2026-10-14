import * as text from "../../../../kit/text.js";

/** Where a global ticket view claim is in its life cycle. */
export type GlobalTicketViewClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global ticket view claim, with what the planners need to act on it. */
export class GlobalTicketViewClaim {
  code: string;
  title: string;
  description: string;
  campaignRef: string;
  unit: string;
  externalRef: string;
  startsAt: number;
  category: string;
  active: boolean;
  capacity: number;
  audienceId: string;
  status: GlobalTicketViewClaimStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    campaignRef: string,
    unit: string,
    externalRef: string,
    startsAt: number,
    category: string,
    active: boolean,
    capacity: number,
    audienceId: string,
    status: GlobalTicketViewClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.externalRef = externalRef;
    this.startsAt = startsAt;
    this.category = category;
    this.active = active;
    this.capacity = capacity;
    this.audienceId = audienceId;
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

  canMoveTo(next: GlobalTicketViewClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalTicketViewClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global ticket view claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global ticket view claim"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.capacity - this.startsAt) * 100) / 100;
  }

  copy(): GlobalTicketViewClaim {
    return new GlobalTicketViewClaim(
      this.code,
      this.title,
      this.description,
      this.campaignRef,
      this.unit,
      this.externalRef,
      this.startsAt,
      this.category,
      this.active,
      this.capacity,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global ticket view claim in status open. */
export function newGlobalTicketViewClaim(code: string, title: string): GlobalTicketViewClaim {
  return new GlobalTicketViewClaim(code, title, "", "", "", "", 0, "", false, 0, "", "open");
}
