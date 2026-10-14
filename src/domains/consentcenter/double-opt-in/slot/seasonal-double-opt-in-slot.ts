/**
 * The seasonal double opt in slot records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal double opt in slot is in its life cycle. */
export type SeasonalDoubleOptInSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal double opt in slot, with what the planners need to act on it. */
export class SeasonalDoubleOptInSlot {
  code: string;
  name: string;
  archived: boolean;
  graceDays: number;
  phone: string;
  endsAt: number;
  audienceId: string;
  status: SeasonalDoubleOptInSlotStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    graceDays: number,
    phone: string,
    endsAt: number,
    audienceId: string,
    status: SeasonalDoubleOptInSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.graceDays = graceDays;
    this.phone = phone;
    this.endsAt = endsAt;
    this.audienceId = audienceId;
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

  canMoveTo(next: SeasonalDoubleOptInSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalDoubleOptInSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal double opt in slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round(this.endsAt * this.graceDays * 100) / 100;
  }

  copy(): SeasonalDoubleOptInSlot {
    return new SeasonalDoubleOptInSlot(
      this.code,
      this.name,
      this.archived,
      this.graceDays,
      this.phone,
      this.endsAt,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal double opt in slot in status draft. */
export function newSeasonalDoubleOptInSlot(code: string, name: string): SeasonalDoubleOptInSlot {
  return new SeasonalDoubleOptInSlot(code, name, false, 0, "", 0, "", "draft");
}
