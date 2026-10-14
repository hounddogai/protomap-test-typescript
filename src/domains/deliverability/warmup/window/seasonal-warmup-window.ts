/**
 * The seasonal warmup window records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup window is in its life cycle. */
export type SeasonalWarmupWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a seasonal warmup window and its current status. */
export class SeasonalWarmupWindow {
  code: string;
  title: string;
  locale: string;
  ratio: number;
  ownerId: string;
  externalRef: string;
  status: SeasonalWarmupWindowStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    ratio: number,
    ownerId: string,
    externalRef: string,
    status: SeasonalWarmupWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalWarmupWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalWarmupWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): SeasonalWarmupWindow {
    return new SeasonalWarmupWindow(
      this.code,
      this.title,
      this.locale,
      this.ratio,
      this.ownerId,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal warmup window in status new. */
export function newSeasonalWarmupWindow(code: string, title: string): SeasonalWarmupWindow {
  return new SeasonalWarmupWindow(code, title, "", 0, "", "", "new");
}
