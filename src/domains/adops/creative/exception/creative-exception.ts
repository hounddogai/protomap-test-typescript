/**
 * The creative exception records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative exception is in its life cycle. */
export type CreativeExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A creative exception as the creative team keeps it. */
export class CreativeException {
  code: string;
  name: string;
  campaignRef: string;
  floorValue: number;
  segment: string;
  contactEmail: string;
  maximum: number;
  timezone: string;
  notes: string;
  durationMinutes: number;
  status: CreativeExceptionStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    floorValue: number,
    segment: string,
    contactEmail: string,
    maximum: number,
    timezone: string,
    notes: string,
    durationMinutes: number,
    status: CreativeExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.floorValue = floorValue;
    this.segment = segment;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.timezone = timezone;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreativeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.floorValue - this.maximum) * 100) / 100;
  }

  copy(): CreativeException {
    return new CreativeException(
      this.code,
      this.name,
      this.campaignRef,
      this.floorValue,
      this.segment,
      this.contactEmail,
      this.maximum,
      this.timezone,
      this.notes,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a creative exception in status planned. */
export function newCreativeException(code: string, name: string): CreativeException {
  return new CreativeException(code, name, "", 0, "", "", 0, "", "", 0, "planned");
}
