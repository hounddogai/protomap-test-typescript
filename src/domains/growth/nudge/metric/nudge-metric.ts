/**
 * The nudge metric records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge metric is in its life cycle. */
export type NudgeMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** One nudge metric, with what the planners need to act on it. */
export class NudgeMetric {
  code: string;
  label: string;
  visible: boolean;
  archived: boolean;
  score: number;
  attempts: number;
  audienceId: string;
  status: NudgeMetricStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    archived: boolean,
    score: number,
    attempts: number,
    audienceId: string,
    status: NudgeMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.archived = archived;
    this.score = score;
    this.attempts = attempts;
    this.audienceId = audienceId;
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

  canMoveTo(next: NudgeMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.score * this.attempts * 100) / 100;
  }

  copy(): NudgeMetric {
    return new NudgeMetric(
      this.code,
      this.label,
      this.visible,
      this.archived,
      this.score,
      this.attempts,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a nudge metric in status requested. */
export function newNudgeMetric(code: string, label: string): NudgeMetric {
  return new NudgeMetric(code, label, false, false, 0, 0, "", "requested");
}
