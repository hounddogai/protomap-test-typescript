import * as text from "../../../../kit/text.js";

/** Where a capped flight score is in its life cycle. */
export type CappedFlightScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One capped flight score, with what the planners need to act on it. */
export class CappedFlightScore {
  code: string;
  title: string;
  budget: number;
  minimum: number;
  sequence: number;
  utmSource: string;
  windowDays: number;
  quantity: number;
  contactEmail: string;
  impressions: number;
  channel: string;
  status: CappedFlightScoreStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    minimum: number,
    sequence: number,
    utmSource: string,
    windowDays: number,
    quantity: number,
    contactEmail: string,
    impressions: number,
    channel: string,
    status: CappedFlightScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.minimum = minimum;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.channel = channel;
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

  canMoveTo(next: CappedFlightScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CappedFlightScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped flight score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.windowDays + this.sequence) * 100) / 100;
  }

  copy(): CappedFlightScore {
    return new CappedFlightScore(
      this.code,
      this.title,
      this.budget,
      this.minimum,
      this.sequence,
      this.utmSource,
      this.windowDays,
      this.quantity,
      this.contactEmail,
      this.impressions,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped flight score in status draft. */
export function newCappedFlightScore(code: string, title: string): CappedFlightScore {
  return new CappedFlightScore(code, title, 0, 0, 0, "", 0, 0, "", 0, "", "draft");
}
