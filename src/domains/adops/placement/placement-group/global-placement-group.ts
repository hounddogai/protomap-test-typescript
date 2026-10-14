/**
 * The global placement group records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global placement group is in its life cycle. */
export type GlobalPlacementGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One global placement group, with what the planners need to act on it. */
export class GlobalPlacementGroup {
  code: string;
  title: string;
  attempts: number;
  discount: number;
  archived: boolean;
  contactEmail: string;
  status: GlobalPlacementGroupStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    discount: number,
    archived: boolean,
    contactEmail: string,
    status: GlobalPlacementGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.discount = discount;
    this.archived = archived;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: GlobalPlacementGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
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

  moveTo(next: GlobalPlacementGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global placement group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.discount * this.attempts * 100) / 100;
  }

  copy(): GlobalPlacementGroup {
    return new GlobalPlacementGroup(
      this.code,
      this.title,
      this.attempts,
      this.discount,
      this.archived,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global placement group in status planned. */
export function newGlobalPlacementGroup(code: string, title: string): GlobalPlacementGroup {
  return new GlobalPlacementGroup(code, title, 0, 0, false, "", "planned");
}
