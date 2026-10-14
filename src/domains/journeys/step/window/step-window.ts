/**
 * The step window records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step window is in its life cycle. */
export type StepWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One step window, with what the planners need to act on it. */
export class StepWindow {
  code: string;
  title: string;
  channel: string;
  score: number;
  impressions: number;
  visible: boolean;
  openRate: number;
  campaignRef: string;
  minimum: number;
  source: string;
  status: StepWindowStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    score: number,
    impressions: number,
    visible: boolean,
    openRate: number,
    campaignRef: string,
    minimum: number,
    source: string,
    status: StepWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.score = score;
    this.impressions = impressions;
    this.visible = visible;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.source = source;
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

  canMoveTo(next: StepWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StepWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.minimum) * 100) / 100;
  }

  copy(): StepWindow {
    return new StepWindow(
      this.code,
      this.title,
      this.channel,
      this.score,
      this.impressions,
      this.visible,
      this.openRate,
      this.campaignRef,
      this.minimum,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a step window in status idle. */
export function newStepWindow(code: string, title: string): StepWindow {
  return new StepWindow(code, title, "", 0, 0, false, 0, "", 0, "", "idle");
}
