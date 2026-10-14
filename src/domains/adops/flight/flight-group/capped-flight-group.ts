/**
 * The capped flight group records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped flight group is in its life cycle. */
export type CappedFlightGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped flight group, with what the planners need to act on it. */
export class CappedFlightGroup {
  code: string;
  title: string;
  ceiling: number;
  campaignRef: string;
  startsAt: number;
  approved: boolean;
  attributes: Map<string, string>;
  status: CappedFlightGroupStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    campaignRef: string,
    startsAt: number,
    approved: boolean,
    attributes: Map<string, string>,
    status: CappedFlightGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.approved = approved;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFlightGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFlightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped flight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.startsAt + this.ceiling) * 100) / 100;
  }

  copy(): CappedFlightGroup {
    return new CappedFlightGroup(
      this.code,
      this.title,
      this.ceiling,
      this.campaignRef,
      this.startsAt,
      this.approved,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped flight group in status proposed. */
export function newCappedFlightGroup(code: string, title: string): CappedFlightGroup {
  return new CappedFlightGroup(code, title, 0, "", 0, false, new Map<string, string>(), "proposed");
}
