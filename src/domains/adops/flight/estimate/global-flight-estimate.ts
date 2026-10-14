/**
 * The global flight estimate records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global flight estimate is in its life cycle. */
export type GlobalFlightEstimateStatus = "created" | "validated" | "published" | "retired";

/** The record of a global flight estimate and its current status. */
export class GlobalFlightEstimate {
  code: string;
  title: string;
  country: string;
  channel: string;
  audienceId: string;
  archived: boolean;
  quantity: number;
  status: GlobalFlightEstimateStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    channel: string,
    audienceId: string,
    archived: boolean,
    quantity: number,
    status: GlobalFlightEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.channel = channel;
    this.audienceId = audienceId;
    this.archived = archived;
    this.quantity = quantity;
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

  canMoveTo(next: GlobalFlightEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalFlightEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): GlobalFlightEstimate {
    return new GlobalFlightEstimate(
      this.code,
      this.title,
      this.country,
      this.channel,
      this.audienceId,
      this.archived,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global flight estimate in status created. */
export function newGlobalFlightEstimate(code: string, title: string): GlobalFlightEstimate {
  return new GlobalFlightEstimate(code, title, "", "", "", false, 0, "created");
}
