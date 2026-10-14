import * as text from "../../../../kit/text.js";

/** Where a global flight bundle is in its life cycle. */
export type GlobalFlightBundleStatus = "created" | "validated" | "published" | "retired";

/** A global flight bundle as the flight team keeps it. */
export class GlobalFlightBundle {
  code: string;
  name: string;
  sendAt: number;
  approved: boolean;
  variant: string;
  category: string;
  journeyId: string;
  status: GlobalFlightBundleStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    approved: boolean,
    variant: string,
    category: string,
    journeyId: string,
    status: GlobalFlightBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.approved = approved;
    this.variant = variant;
    this.category = category;
    this.journeyId = journeyId;
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

  canMoveTo(next: GlobalFlightBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalFlightBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): GlobalFlightBundle {
    return new GlobalFlightBundle(
      this.code,
      this.name,
      this.sendAt,
      this.approved,
      this.variant,
      this.category,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global flight bundle in status created. */
export function newGlobalFlightBundle(code: string, name: string): GlobalFlightBundle {
  return new GlobalFlightBundle(code, name, 0, false, "", "", "", "created");
}
