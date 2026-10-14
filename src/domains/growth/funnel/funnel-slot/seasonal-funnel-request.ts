import * as text from "../../../../kit/text.js";

/** Where a seasonal funnel request is in its life cycle. */
export type SeasonalFunnelRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal funnel request as the funnel team keeps it. */
export class SeasonalFunnelRequest {
  code: string;
  name: string;
  visible: boolean;
  rate: number;
  attempts: number;
  notes: string;
  sequence: number;
  quantity: number;
  locale: string;
  pinned: boolean;
  status: SeasonalFunnelRequestStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    rate: number,
    attempts: number,
    notes: string,
    sequence: number,
    quantity: number,
    locale: string,
    pinned: boolean,
    status: SeasonalFunnelRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.rate = rate;
    this.attempts = attempts;
    this.notes = notes;
    this.sequence = sequence;
    this.quantity = quantity;
    this.locale = locale;
    this.pinned = pinned;
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

  canMoveTo(next: SeasonalFunnelRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalFunnelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal funnel request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.attempts - this.quantity) * 100) / 100;
  }

  copy(): SeasonalFunnelRequest {
    return new SeasonalFunnelRequest(
      this.code,
      this.name,
      this.visible,
      this.rate,
      this.attempts,
      this.notes,
      this.sequence,
      this.quantity,
      this.locale,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal funnel request in status draft. */
export function newSeasonalFunnelRequest(code: string, name: string): SeasonalFunnelRequest {
  return new SeasonalFunnelRequest(code, name, false, 0, 0, "", 0, 0, "", false, "draft");
}
