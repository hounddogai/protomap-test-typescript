/**
 * The seasonal funnel summary records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal funnel summary is in its life cycle. */
export type SeasonalFunnelSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal funnel summary, with what the planners need to act on it. */
export class SeasonalFunnelSummary {
  code: string;
  label: string;
  name: string;
  channel: string;
  visible: boolean;
  floorValue: number;
  status: SeasonalFunnelSummaryStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    channel: string,
    visible: boolean,
    floorValue: number,
    status: SeasonalFunnelSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.channel = channel;
    this.visible = visible;
    this.floorValue = floorValue;
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

  canMoveTo(next: SeasonalFunnelSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalFunnelSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal funnel summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): SeasonalFunnelSummary {
    return new SeasonalFunnelSummary(
      this.code,
      this.label,
      this.name,
      this.channel,
      this.visible,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal funnel summary in status idle. */
export function newSeasonalFunnelSummary(code: string, label: string): SeasonalFunnelSummary {
  return new SeasonalFunnelSummary(code, label, "", "", false, 0, "idle");
}
