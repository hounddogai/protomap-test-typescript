import * as text from "../../../../kit/text.js";

/** Where a touchpoint estimate is in its life cycle. */
export type TouchpointEstimateStatus = "created" | "validated" | "published" | "retired";

/** The record of a touchpoint estimate and its current status. */
export class TouchpointEstimate {
  code: string;
  label: string;
  audienceId: string;
  attempts: number;
  tags: string[];
  capacity: number;
  segment: string;
  pinned: boolean;
  status: TouchpointEstimateStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    attempts: number,
    tags: string[],
    capacity: number,
    segment: string,
    pinned: boolean,
    status: TouchpointEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.tags = tags;
    this.capacity = capacity;
    this.segment = segment;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"touchpoint estimate"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round(this.capacity * this.attempts * 100) / 100;
  }

  copy(): TouchpointEstimate {
    return new TouchpointEstimate(
      this.code,
      this.label,
      this.audienceId,
      this.attempts,
      this.tags,
      this.capacity,
      this.segment,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a touchpoint estimate in status created. */
export function newTouchpointEstimate(code: string, label: string): TouchpointEstimate {
  return new TouchpointEstimate(code, label, "", 0, [], 0, "", false, "created");
}
