import * as text from "../../../../kit/text.js";

/** Where a rolling retention score is in its life cycle. */
export type RollingRetentionScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling retention score and its current status. */
export class RollingRetentionScore {
  code: string;
  label: string;
  updatedAt: number;
  name: string;
  windowDays: number;
  revision: number;
  discount: number;
  status: RollingRetentionScoreStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    name: string,
    windowDays: number,
    revision: number,
    discount: number,
    status: RollingRetentionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.name = name;
    this.windowDays = windowDays;
    this.revision = revision;
    this.discount = discount;
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

  canMoveTo(next: RollingRetentionScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingRetentionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling retention score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.revision - this.discount) * 100) / 100;
  }

  copy(): RollingRetentionScore {
    return new RollingRetentionScore(
      this.code,
      this.label,
      this.updatedAt,
      this.name,
      this.windowDays,
      this.revision,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling retention score in status idle. */
export function newRollingRetentionScore(code: string, label: string): RollingRetentionScore {
  return new RollingRetentionScore(code, label, 0, "", 0, 0, 0, "idle");
}
