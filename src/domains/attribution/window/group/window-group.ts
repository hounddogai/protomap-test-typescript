/**
 * The window group records of attribution's window work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window group is in its life cycle. */
export type WindowGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** One window group, with what the planners need to act on it. */
export class WindowGroup {
  code: string;
  name: string;
  locale: string;
  score: number;
  maximum: number;
  cost: number;
  source: string;
  campaignRef: string;
  floorValue: number;
  summary: string;
  journeyId: string;
  status: WindowGroupStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    score: number,
    maximum: number,
    cost: number,
    source: string,
    campaignRef: string,
    floorValue: number,
    summary: string,
    journeyId: string,
    status: WindowGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.score = score;
    this.maximum = maximum;
    this.cost = cost;
    this.source = source;
    this.campaignRef = campaignRef;
    this.floorValue = floorValue;
    this.summary = summary;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round(this.score * this.maximum * 100) / 100;
  }

  copy(): WindowGroup {
    return new WindowGroup(
      this.code,
      this.name,
      this.locale,
      this.score,
      this.maximum,
      this.cost,
      this.source,
      this.campaignRef,
      this.floorValue,
      this.summary,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window group in status requested. */
export function newWindowGroup(code: string, name: string): WindowGroup {
  return new WindowGroup(code, name, "", 0, 0, 0, "", "", 0, "", "", "requested");
}
