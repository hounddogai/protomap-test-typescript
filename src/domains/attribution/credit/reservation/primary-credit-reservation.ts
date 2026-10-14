/**
 * The primary credit reservation records of attribution's credit work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary credit reservation is in its life cycle. */
export type PrimaryCreditReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary credit reservation and its current status. */
export class PrimaryCreditReservation {
  code: string;
  name: string;
  segment: string;
  bid: number;
  score: number;
  impressions: number;
  source: string;
  maximum: number;
  endsAt: number;
  title: string;
  phone: string;
  status: PrimaryCreditReservationStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    bid: number,
    score: number,
    impressions: number,
    source: string,
    maximum: number,
    endsAt: number,
    title: string,
    phone: string,
    status: PrimaryCreditReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.bid = bid;
    this.score = score;
    this.impressions = impressions;
    this.source = source;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.title = title;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryCreditReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryCreditReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary credit reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary credit reservation"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.endsAt + this.bid) * 100) / 100;
  }

  copy(): PrimaryCreditReservation {
    return new PrimaryCreditReservation(
      this.code,
      this.name,
      this.segment,
      this.bid,
      this.score,
      this.impressions,
      this.source,
      this.maximum,
      this.endsAt,
      this.title,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary credit reservation in status idle. */
export function newPrimaryCreditReservation(code: string, name: string): PrimaryCreditReservation {
  return new PrimaryCreditReservation(code, name, "", 0, 0, 0, "", 0, 0, "", "", "idle");
}
