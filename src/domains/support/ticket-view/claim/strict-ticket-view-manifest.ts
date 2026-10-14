import * as text from "../../../../kit/text.js";

/** Where a strict ticket view manifest is in its life cycle. */
export type StrictTicketViewManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict ticket view manifest. Its code is unique within a tenant. */
export class StrictTicketViewManifest {
  code: string;
  title: string;
  approved: boolean;
  amount: number;
  journeyId: string;
  status: StrictTicketViewManifestStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    amount: number,
    journeyId: string,
    status: StrictTicketViewManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.amount = amount;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictTicketViewManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictTicketViewManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict ticket view manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict ticket view manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StrictTicketViewManifest {
    return new StrictTicketViewManifest(this.code, this.title, this.approved, this.amount, this.journeyId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict ticket view manifest in status requested. */
export function newStrictTicketViewManifest(code: string, title: string): StrictTicketViewManifest {
  return new StrictTicketViewManifest(code, title, false, 0, "", "requested");
}
