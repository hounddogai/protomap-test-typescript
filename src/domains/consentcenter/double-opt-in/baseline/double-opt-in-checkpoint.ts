import * as text from "../../../../kit/text.js";

/** Where a double opt in checkpoint is in its life cycle. */
export type DoubleOptInCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A double opt in checkpoint. Its code is unique within a tenant. */
export class DoubleOptInCheckpoint {
  code: string;
  title: string;
  maximum: number;
  active: boolean;
  segment: string;
  pinned: boolean;
  version: number;
  label: string;
  status: DoubleOptInCheckpointStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    active: boolean,
    segment: string,
    pinned: boolean,
    version: number,
    label: string,
    status: DoubleOptInCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.active = active;
    this.segment = segment;
    this.pinned = pinned;
    this.version = version;
    this.label = label;
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

  canMoveTo(next: DoubleOptInCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.version + this.maximum) * 100) / 100;
  }

  copy(): DoubleOptInCheckpoint {
    return new DoubleOptInCheckpoint(
      this.code,
      this.title,
      this.maximum,
      this.active,
      this.segment,
      this.pinned,
      this.version,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a double opt in checkpoint in status idle. */
export function newDoubleOptInCheckpoint(code: string, title: string): DoubleOptInCheckpoint {
  return new DoubleOptInCheckpoint(code, title, 0, false, "", false, 0, "", "idle");
}
