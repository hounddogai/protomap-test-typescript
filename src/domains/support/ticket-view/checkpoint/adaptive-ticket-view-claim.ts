import * as text from "../../../../kit/text.js";

/** Where a adaptive ticket view claim is in its life cycle. */
export type AdaptiveTicketViewClaimStatus = "created" | "validated" | "published" | "retired";

/** One adaptive ticket view claim, with what the planners need to act on it. */
export class AdaptiveTicketViewClaim {
  code: string;
  label: string;
  name: string;
  ratio: number;
  maximum: number;
  source: string;
  channel: string;
  pinned: boolean;
  category: string;
  rate: number;
  status: AdaptiveTicketViewClaimStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    ratio: number,
    maximum: number,
    source: string,
    channel: string,
    pinned: boolean,
    category: string,
    rate: number,
    status: AdaptiveTicketViewClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.ratio = ratio;
    this.maximum = maximum;
    this.source = source;
    this.channel = channel;
    this.pinned = pinned;
    this.category = category;
    this.rate = rate;
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

  canMoveTo(next: AdaptiveTicketViewClaimStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: AdaptiveTicketViewClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive ticket view claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive ticket view claim"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.maximum + this.ratio) * 100) / 100;
  }

  copy(): AdaptiveTicketViewClaim {
    return new AdaptiveTicketViewClaim(
      this.code,
      this.label,
      this.name,
      this.ratio,
      this.maximum,
      this.source,
      this.channel,
      this.pinned,
      this.category,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive ticket view claim in status created. */
export function newAdaptiveTicketViewClaim(code: string, label: string): AdaptiveTicketViewClaim {
  return new AdaptiveTicketViewClaim(code, label, "", 0, 0, "", "", false, "", 0, "created");
}
