/**
 * The seasonal reply window records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal reply window is in its life cycle. */
export type SeasonalReplyWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal reply window, with what the planners need to act on it. */
export class SeasonalReplyWindow {
  code: string;
  label: string;
  attributes: Map<string, string>;
  attempts: number;
  openRate: number;
  version: number;
  audienceId: string;
  variant: string;
  status: SeasonalReplyWindowStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    attempts: number,
    openRate: number,
    version: number,
    audienceId: string,
    variant: string,
    status: SeasonalReplyWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.attempts = attempts;
    this.openRate = openRate;
    this.version = version;
    this.audienceId = audienceId;
    this.variant = variant;
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

  canMoveTo(next: SeasonalReplyWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalReplyWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reply window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round(this.version * this.attempts * 100) / 100;
  }

  copy(): SeasonalReplyWindow {
    return new SeasonalReplyWindow(
      this.code,
      this.label,
      this.attributes,
      this.attempts,
      this.openRate,
      this.version,
      this.audienceId,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal reply window in status idle. */
export function newSeasonalReplyWindow(code: string, label: string): SeasonalReplyWindow {
  return new SeasonalReplyWindow(code, label, new Map<string, string>(), 0, 0, 0, "", "", "idle");
}
