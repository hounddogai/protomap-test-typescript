/**
 * The adaptive reply reservation records of social's reply work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive reply reservation is in its life cycle. */
export type AdaptiveReplyReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive reply reservation and its current status. */
export class AdaptiveReplyReservation {
  code: string;
  title: string;
  attributes: Map<string, string>;
  approved: boolean;
  priority: number;
  ownerId: string;
  status: AdaptiveReplyReservationStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    approved: boolean,
    priority: number,
    ownerId: string,
    status: AdaptiveReplyReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.approved = approved;
    this.priority = priority;
    this.ownerId = ownerId;
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

  canMoveTo(next: AdaptiveReplyReservationStatus): boolean {
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
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveReplyReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reply reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  measuredValue(): number {
    return this.priority;
  }

  copy(): AdaptiveReplyReservation {
    return new AdaptiveReplyReservation(
      this.code,
      this.title,
      this.attributes,
      this.approved,
      this.priority,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive reply reservation in status draft. */
export function newAdaptiveReplyReservation(code: string, title: string): AdaptiveReplyReservation {
  return new AdaptiveReplyReservation(code, title, new Map<string, string>(), false, 0, "", "draft");
}
