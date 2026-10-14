import * as text from "../../../../kit/text.js";

/** Where a primary paywall cycle is in its life cycle. */
export type PrimaryPaywallCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary paywall cycle as the paywall team keeps it. */
export class PrimaryPaywallCycle {
  code: string;
  label: string;
  contactEmail: string;
  checksum: string;
  endsAt: number;
  margin: number;
  status: PrimaryPaywallCycleStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    checksum: string,
    endsAt: number,
    margin: number,
    status: PrimaryPaywallCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.endsAt = endsAt;
    this.margin = margin;
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

  canMoveTo(next: PrimaryPaywallCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPaywallCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary paywall cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary paywall cycle"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.endsAt * this.margin * 100) / 100;
  }

  copy(): PrimaryPaywallCycle {
    return new PrimaryPaywallCycle(
      this.code,
      this.label,
      this.contactEmail,
      this.checksum,
      this.endsAt,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary paywall cycle in status draft. */
export function newPrimaryPaywallCycle(code: string, label: string): PrimaryPaywallCycle {
  return new PrimaryPaywallCycle(code, label, "", "", 0, 0, "draft");
}
