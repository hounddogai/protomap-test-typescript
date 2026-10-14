import * as text from "../../../../kit/text.js";

/** Where a strict sender claim is in its life cycle. */
export type StrictSenderClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict sender claim, with what the planners need to act on it. */
export class StrictSenderClaim {
  code: string;
  name: string;
  reviewer: string;
  title: string;
  capacity: number;
  campaignRef: string;
  status: StrictSenderClaimStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    title: string,
    capacity: number,
    campaignRef: string,
    status: StrictSenderClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.title = title;
    this.capacity = capacity;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: StrictSenderClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
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

  moveTo(next: StrictSenderClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict sender claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict sender claim"} ${this.code}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): StrictSenderClaim {
    return new StrictSenderClaim(
      this.code,
      this.name,
      this.reviewer,
      this.title,
      this.capacity,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict sender claim in status open. */
export function newStrictSenderClaim(code: string, name: string): StrictSenderClaim {
  return new StrictSenderClaim(code, name, "", "", 0, "", "open");
}
