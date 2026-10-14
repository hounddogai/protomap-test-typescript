/**
 * The primary csat schedule records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary csat schedule is in its life cycle. */
export type PrimaryCsatScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a primary csat schedule and its current status. */
export class PrimaryCsatSchedule {
  code: string;
  name: string;
  label: string;
  phone: string;
  expiresAt: number;
  checksum: string;
  revision: number;
  ratio: number;
  cost: number;
  pinned: boolean;
  margin: number;
  status: PrimaryCsatScheduleStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    phone: string,
    expiresAt: number,
    checksum: string,
    revision: number,
    ratio: number,
    cost: number,
    pinned: boolean,
    margin: number,
    status: PrimaryCsatScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.phone = phone;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.revision = revision;
    this.ratio = ratio;
    this.cost = cost;
    this.pinned = pinned;
    this.margin = margin;
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

  canMoveTo(next: PrimaryCsatScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryCsatScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary csat schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round(this.ratio * this.margin * 100) / 100;
  }

  copy(): PrimaryCsatSchedule {
    return new PrimaryCsatSchedule(
      this.code,
      this.name,
      this.label,
      this.phone,
      this.expiresAt,
      this.checksum,
      this.revision,
      this.ratio,
      this.cost,
      this.pinned,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary csat schedule in status proposed. */
export function newPrimaryCsatSchedule(code: string, name: string): PrimaryCsatSchedule {
  return new PrimaryCsatSchedule(code, name, "", "", 0, "", 0, 0, 0, false, 0, "proposed");
}
