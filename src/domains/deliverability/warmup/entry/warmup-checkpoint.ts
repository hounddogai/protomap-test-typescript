import * as text from "../../../../kit/text.js";

/** Where a warmup checkpoint is in its life cycle. */
export type WarmupCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A warmup checkpoint. Its code is unique within a tenant. */
export class WarmupCheckpoint {
  code: string;
  label: string;
  revision: number;
  reviewer: string;
  variant: string;
  status: WarmupCheckpointStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    reviewer: string,
    variant: string,
    status: WarmupCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.reviewer = reviewer;
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

  canMoveTo(next: WarmupCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
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

  moveTo(next: WarmupCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): WarmupCheckpoint {
    return new WarmupCheckpoint(this.code, this.label, this.revision, this.reviewer, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a warmup checkpoint in status idle. */
export function newWarmupCheckpoint(code: string, label: string): WarmupCheckpoint {
  return new WarmupCheckpoint(code, label, 0, "", "", "idle");
}
