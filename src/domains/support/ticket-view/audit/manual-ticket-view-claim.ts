import * as text from "../../../../kit/text.js";

/** Where a manual ticket view claim is in its life cycle. */
export type ManualTicketViewClaimStatus = "created" | "validated" | "published" | "retired";

/** One manual ticket view claim, with what the planners need to act on it. */
export class ManualTicketViewClaim {
  code: string;
  title: string;
  endsAt: number;
  windowDays: number;
  sequence: number;
  rate: number;
  maximum: number;
  graceDays: number;
  name: string;
  contactEmail: string;
  visible: boolean;
  status: ManualTicketViewClaimStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    windowDays: number,
    sequence: number,
    rate: number,
    maximum: number,
    graceDays: number,
    name: string,
    contactEmail: string,
    visible: boolean,
    status: ManualTicketViewClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
    this.sequence = sequence;
    this.rate = rate;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.name = name;
    this.contactEmail = contactEmail;
    this.visible = visible;
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

  canMoveTo(next: ManualTicketViewClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualTicketViewClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual ticket view claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual ticket view claim"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.maximum - this.rate) * 100) / 100;
  }

  copy(): ManualTicketViewClaim {
    return new ManualTicketViewClaim(
      this.code,
      this.title,
      this.endsAt,
      this.windowDays,
      this.sequence,
      this.rate,
      this.maximum,
      this.graceDays,
      this.name,
      this.contactEmail,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual ticket view claim in status created. */
export function newManualTicketViewClaim(code: string, title: string): ManualTicketViewClaim {
  return new ManualTicketViewClaim(code, title, 0, 0, 0, 0, 0, 0, "", "", false, "created");
}
