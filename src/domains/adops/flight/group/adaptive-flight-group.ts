/**
 * The adaptive flight group records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive flight group is in its life cycle. */
export type AdaptiveFlightGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One adaptive flight group, with what the planners need to act on it. */
export class AdaptiveFlightGroup {
  code: string;
  label: string;
  audienceId: string;
  margin: number;
  cost: number;
  externalRef: string;
  visible: boolean;
  channel: string;
  bid: number;
  revision: number;
  status: AdaptiveFlightGroupStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    margin: number,
    cost: number,
    externalRef: string,
    visible: boolean,
    channel: string,
    bid: number,
    revision: number,
    status: AdaptiveFlightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.margin = margin;
    this.cost = cost;
    this.externalRef = externalRef;
    this.visible = visible;
    this.channel = channel;
    this.bid = bid;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveFlightGroupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveFlightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive flight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"adaptive flight group"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.bid - this.cost) * 100) / 100;
  }

  copy(): AdaptiveFlightGroup {
    return new AdaptiveFlightGroup(
      this.code,
      this.label,
      this.audienceId,
      this.margin,
      this.cost,
      this.externalRef,
      this.visible,
      this.channel,
      this.bid,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive flight group in status open. */
export function newAdaptiveFlightGroup(code: string, label: string): AdaptiveFlightGroup {
  return new AdaptiveFlightGroup(code, label, "", 0, 0, "", false, "", 0, 0, "open");
}
