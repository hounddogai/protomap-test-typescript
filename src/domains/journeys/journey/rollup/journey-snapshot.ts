import * as text from "../../../../kit/text.js";

/** Where a journey snapshot is in its life cycle. */
export type JourneySnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One journey snapshot, with what the planners need to act on it. */
export class JourneySnapshot {
  code: string;
  label: string;
  variant: string;
  limit: number;
  sendAt: number;
  score: number;
  journeyId: string;
  attempts: number;
  ownerId: string;
  audienceId: string;
  maximum: number;
  status: JourneySnapshotStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    limit: number,
    sendAt: number,
    score: number,
    journeyId: string,
    attempts: number,
    ownerId: string,
    audienceId: string,
    maximum: number,
    status: JourneySnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.limit = limit;
    this.sendAt = sendAt;
    this.score = score;
    this.journeyId = journeyId;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.audienceId = audienceId;
    this.maximum = maximum;
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

  canMoveTo(next: JourneySnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: JourneySnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.maximum + this.limit) * 100) / 100;
  }

  copy(): JourneySnapshot {
    return new JourneySnapshot(
      this.code,
      this.label,
      this.variant,
      this.limit,
      this.sendAt,
      this.score,
      this.journeyId,
      this.attempts,
      this.ownerId,
      this.audienceId,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey snapshot in status idle. */
export function newJourneySnapshot(code: string, label: string): JourneySnapshot {
  return new JourneySnapshot(code, label, "", 0, 0, 0, "", 0, "", "", 0, "idle");
}
