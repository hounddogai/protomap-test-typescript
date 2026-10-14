import * as text from "../../../../kit/text.js";

/** Where a pacing batch is in its life cycle. */
export type PacingBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pacing batch and its current status. */
export class PacingBatch {
  code: string;
  name: string;
  ownerId: string;
  impressions: number;
  pinned: boolean;
  summary: string;
  status: PacingBatchStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    impressions: number,
    pinned: boolean,
    summary: string,
    status: PacingBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.impressions = impressions;
    this.pinned = pinned;
    this.summary = summary;
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

  canMoveTo(next: PacingBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PacingBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): PacingBatch {
    return new PacingBatch(
      this.code,
      this.name,
      this.ownerId,
      this.impressions,
      this.pinned,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pacing batch in status idle. */
export function newPacingBatch(code: string, name: string): PacingBatch {
  return new PacingBatch(code, name, "", 0, false, "", "idle");
}
