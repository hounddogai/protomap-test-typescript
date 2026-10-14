import * as text from "../../../../kit/text.js";

/** Where a default flight checkpoint is in its life cycle. */
export type DefaultFlightCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default flight checkpoint as the flight team keeps it. */
export class DefaultFlightCheckpoint {
  code: string;
  title: string;
  summary: string;
  archived: boolean;
  utmSource: string;
  checksum: string;
  pinned: boolean;
  threshold: number;
  batchSize: number;
  region: string;
  margin: number;
  status: DefaultFlightCheckpointStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    archived: boolean,
    utmSource: string,
    checksum: string,
    pinned: boolean,
    threshold: number,
    batchSize: number,
    region: string,
    margin: number,
    status: DefaultFlightCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.archived = archived;
    this.utmSource = utmSource;
    this.checksum = checksum;
    this.pinned = pinned;
    this.threshold = threshold;
    this.batchSize = batchSize;
    this.region = region;
    this.margin = margin;
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

  canMoveTo(next: DefaultFlightCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultFlightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default flight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default flight checkpoint"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.margin * this.threshold * 100) / 100;
  }

  copy(): DefaultFlightCheckpoint {
    return new DefaultFlightCheckpoint(
      this.code,
      this.title,
      this.summary,
      this.archived,
      this.utmSource,
      this.checksum,
      this.pinned,
      this.threshold,
      this.batchSize,
      this.region,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default flight checkpoint in status idle. */
export function newDefaultFlightCheckpoint(code: string, title: string): DefaultFlightCheckpoint {
  return new DefaultFlightCheckpoint(code, title, "", false, "", "", false, 0, 0, "", 0, "idle");
}
