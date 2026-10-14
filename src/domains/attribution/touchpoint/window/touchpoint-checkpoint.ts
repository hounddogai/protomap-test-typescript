import * as text from "../../../../kit/text.js";

/** Where a touchpoint checkpoint is in its life cycle. */
export type TouchpointCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A touchpoint checkpoint. Its code is unique within a tenant. */
export class TouchpointCheckpoint {
  code: string;
  label: string;
  attempts: number;
  quantity: number;
  region: string;
  maximum: number;
  ceiling: number;
  description: string;
  floorValue: number;
  score: number;
  timezone: string;
  status: TouchpointCheckpointStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    quantity: number,
    region: string,
    maximum: number,
    ceiling: number,
    description: string,
    floorValue: number,
    score: number,
    timezone: string,
    status: TouchpointCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.quantity = quantity;
    this.region = region;
    this.maximum = maximum;
    this.ceiling = ceiling;
    this.description = description;
    this.floorValue = floorValue;
    this.score = score;
    this.timezone = timezone;
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

  canMoveTo(next: TouchpointCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.quantity * this.maximum * 100) / 100;
  }

  copy(): TouchpointCheckpoint {
    return new TouchpointCheckpoint(
      this.code,
      this.label,
      this.attempts,
      this.quantity,
      this.region,
      this.maximum,
      this.ceiling,
      this.description,
      this.floorValue,
      this.score,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a touchpoint checkpoint in status idle. */
export function newTouchpointCheckpoint(code: string, label: string): TouchpointCheckpoint {
  return new TouchpointCheckpoint(code, label, 0, 0, "", 0, 0, "", 0, 0, "", "idle");
}
