/**
 * The scheduled wait bundle records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled wait bundle is in its life cycle. */
export type ScheduledWaitBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One scheduled wait bundle, with what the planners need to act on it. */
export class ScheduledWaitBundle {
  code: string;
  title: string;
  endsAt: number;
  description: string;
  tags: string[];
  contactEmail: string;
  status: ScheduledWaitBundleStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    description: string,
    tags: string[],
    contactEmail: string,
    status: ScheduledWaitBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.description = description;
    this.tags = tags;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ScheduledWaitBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledWaitBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled wait bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled wait bundle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): ScheduledWaitBundle {
    return new ScheduledWaitBundle(
      this.code,
      this.title,
      this.endsAt,
      this.description,
      this.tags,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled wait bundle in status proposed. */
export function newScheduledWaitBundle(code: string, title: string): ScheduledWaitBundle {
  return new ScheduledWaitBundle(code, title, 0, "", [], "", "proposed");
}
