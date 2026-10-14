import * as text from "../../../../kit/text.js";

/** Where a adaptive deflection score is in its life cycle. */
export type AdaptiveDeflectionScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a adaptive deflection score and its current status. */
export class AdaptiveDeflectionScore {
  code: string;
  title: string;
  threshold: number;
  archived: boolean;
  durationMinutes: number;
  region: string;
  margin: number;
  frequencyCap: number;
  status: AdaptiveDeflectionScoreStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    archived: boolean,
    durationMinutes: number,
    region: string,
    margin: number,
    frequencyCap: number,
    status: AdaptiveDeflectionScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: AdaptiveDeflectionScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveDeflectionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive deflection score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.threshold - this.margin) * 100) / 100;
  }

  copy(): AdaptiveDeflectionScore {
    return new AdaptiveDeflectionScore(
      this.code,
      this.title,
      this.threshold,
      this.archived,
      this.durationMinutes,
      this.region,
      this.margin,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive deflection score in status idle. */
export function newAdaptiveDeflectionScore(code: string, title: string): AdaptiveDeflectionScore {
  return new AdaptiveDeflectionScore(code, title, 0, false, 0, "", 0, 0, "idle");
}
