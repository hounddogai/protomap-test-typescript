/**
 * The capped step bundle records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped step bundle is in its life cycle. */
export type CappedStepBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a capped step bundle and its current status. */
export class CappedStepBundle {
  code: string;
  title: string;
  archived: boolean;
  visible: boolean;
  channel: string;
  journeyId: string;
  active: boolean;
  country: string;
  attributes: Map<string, string>;
  startsAt: number;
  status: CappedStepBundleStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    visible: boolean,
    channel: string,
    journeyId: string,
    active: boolean,
    country: string,
    attributes: Map<string, string>,
    startsAt: number,
    status: CappedStepBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.visible = visible;
    this.channel = channel;
    this.journeyId = journeyId;
    this.active = active;
    this.country = country;
    this.attributes = attributes;
    this.startsAt = startsAt;
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

  canMoveTo(next: CappedStepBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedStepBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped step bundle ${this.code} cannot move from ${this.status} to ${next}`);
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

  copy(): CappedStepBundle {
    return new CappedStepBundle(
      this.code,
      this.title,
      this.archived,
      this.visible,
      this.channel,
      this.journeyId,
      this.active,
      this.country,
      this.attributes,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped step bundle in status draft. */
export function newCappedStepBundle(code: string, title: string): CappedStepBundle {
  return new CappedStepBundle(code, title, false, false, "", "", false, "", new Map<string, string>(), 0, "draft");
}
