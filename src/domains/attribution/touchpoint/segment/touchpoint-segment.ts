/**
 * The touchpoint segment records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint segment is in its life cycle. */
export type TouchpointSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One touchpoint segment, with what the planners need to act on it. */
export class TouchpointSegment {
  code: string;
  title: string;
  score: number;
  channel: string;
  maximum: number;
  archived: boolean;
  status: TouchpointSegmentStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    channel: string,
    maximum: number,
    archived: boolean,
    status: TouchpointSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.channel = channel;
    this.maximum = maximum;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netExposure(): number {
    return Math.round((this.score - this.maximum) * 100) / 100;
  }

  copy(): TouchpointSegment {
    return new TouchpointSegment(
      this.code,
      this.title,
      this.score,
      this.channel,
      this.maximum,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a touchpoint segment in status planned. */
export function newTouchpointSegment(code: string, title: string): TouchpointSegment {
  return new TouchpointSegment(code, title, 0, "", 0, false, "planned");
}
