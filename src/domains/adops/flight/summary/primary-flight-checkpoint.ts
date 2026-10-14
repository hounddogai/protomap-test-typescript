import * as text from "../../../../kit/text.js";

/** Where a primary flight checkpoint is in its life cycle. */
export type PrimaryFlightCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary flight checkpoint, with what the planners need to act on it. */
export class PrimaryFlightCheckpoint {
  code: string;
  name: string;
  floorValue: number;
  maximum: number;
  score: number;
  channel: string;
  audienceId: string;
  archived: boolean;
  status: PrimaryFlightCheckpointStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    maximum: number,
    score: number,
    channel: string,
    audienceId: string,
    archived: boolean,
    status: PrimaryFlightCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.maximum = maximum;
    this.score = score;
    this.channel = channel;
    this.audienceId = audienceId;
    this.archived = archived;
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

  canMoveTo(next: PrimaryFlightCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: PrimaryFlightCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary flight checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary flight checkpoint"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.maximum * this.floorValue * 100) / 100;
  }

  copy(): PrimaryFlightCheckpoint {
    return new PrimaryFlightCheckpoint(
      this.code,
      this.name,
      this.floorValue,
      this.maximum,
      this.score,
      this.channel,
      this.audienceId,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary flight checkpoint in status draft. */
export function newPrimaryFlightCheckpoint(code: string, name: string): PrimaryFlightCheckpoint {
  return new PrimaryFlightCheckpoint(code, name, 0, 0, 0, "", "", false, "draft");
}
