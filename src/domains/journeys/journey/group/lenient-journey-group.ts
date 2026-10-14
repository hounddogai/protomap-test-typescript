/**
 * The lenient journey group records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient journey group is in its life cycle. */
export type LenientJourneyGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient journey group, with what the planners need to act on it. */
export class LenientJourneyGroup {
  code: string;
  title: string;
  attributes: Map<string, string>;
  startsAt: number;
  audienceId: string;
  ownerId: string;
  status: LenientJourneyGroupStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    startsAt: number,
    audienceId: string,
    ownerId: string,
    status: LenientJourneyGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.startsAt = startsAt;
    this.audienceId = audienceId;
    this.ownerId = ownerId;
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

  canMoveTo(next: LenientJourneyGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientJourneyGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient journey group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): LenientJourneyGroup {
    return new LenientJourneyGroup(
      this.code,
      this.title,
      this.attributes,
      this.startsAt,
      this.audienceId,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient journey group in status idle. */
export function newLenientJourneyGroup(code: string, title: string): LenientJourneyGroup {
  return new LenientJourneyGroup(code, title, new Map<string, string>(), 0, "", "", "idle");
}
