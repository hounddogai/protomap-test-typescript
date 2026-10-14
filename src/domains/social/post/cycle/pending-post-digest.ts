import * as text from "../../../../kit/text.js";

/** Where a pending post digest is in its life cycle. */
export type PendingPostDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending post digest, with what the planners need to act on it. */
export class PendingPostDigest {
  code: string;
  label: string;
  threshold: number;
  source: string;
  segment: string;
  durationMinutes: number;
  status: PendingPostDigestStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    source: string,
    segment: string,
    durationMinutes: number,
    status: PendingPostDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.source = source;
    this.segment = segment;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: PendingPostDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingPostDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending post digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.durationMinutes - this.threshold) * 100) / 100;
  }

  copy(): PendingPostDigest {
    return new PendingPostDigest(
      this.code,
      this.label,
      this.threshold,
      this.source,
      this.segment,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending post digest in status idle. */
export function newPendingPostDigest(code: string, label: string): PendingPostDigest {
  return new PendingPostDigest(code, label, 0, "", "", 0, "idle");
}
