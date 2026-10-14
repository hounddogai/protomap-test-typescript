/**
 * The path threshold records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path threshold is in its life cycle. */
export type PathThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a path threshold and its current status. */
export class PathThreshold {
  code: string;
  name: string;
  audienceId: string;
  threshold: number;
  archived: boolean;
  segment: string;
  maximum: number;
  status: PathThresholdStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    threshold: number,
    archived: boolean,
    segment: string,
    maximum: number,
    status: PathThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.threshold = threshold;
    this.archived = archived;
    this.segment = segment;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"path threshold"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.maximum - this.threshold) * 100) / 100;
  }

  copy(): PathThreshold {
    return new PathThreshold(
      this.code,
      this.name,
      this.audienceId,
      this.threshold,
      this.archived,
      this.segment,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a path threshold in status draft. */
export function newPathThreshold(code: string, name: string): PathThreshold {
  return new PathThreshold(code, name, "", 0, false, "", 0, "draft");
}
