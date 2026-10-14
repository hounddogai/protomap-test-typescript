import * as text from "../../../../kit/text.js";

/** Where a capped touchpoint budget is in its life cycle. */
export type CappedTouchpointBudgetStatus = "created" | "validated" | "published" | "retired";

/** One capped touchpoint budget, with what the planners need to act on it. */
export class CappedTouchpointBudget {
  code: string;
  name: string;
  contactEmail: string;
  checksum: string;
  label: string;
  clicks: number;
  sequence: number;
  country: string;
  status: CappedTouchpointBudgetStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    checksum: string,
    label: string,
    clicks: number,
    sequence: number,
    country: string,
    status: CappedTouchpointBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.label = label;
    this.clicks = clicks;
    this.sequence = sequence;
    this.country = country;
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

  canMoveTo(next: CappedTouchpointBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedTouchpointBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped touchpoint budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped touchpoint budget"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.sequence + this.clicks) * 100) / 100;
  }

  copy(): CappedTouchpointBudget {
    return new CappedTouchpointBudget(
      this.code,
      this.name,
      this.contactEmail,
      this.checksum,
      this.label,
      this.clicks,
      this.sequence,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped touchpoint budget in status created. */
export function newCappedTouchpointBudget(code: string, name: string): CappedTouchpointBudget {
  return new CappedTouchpointBudget(code, name, "", "", "", 0, 0, "", "created");
}
