import * as text from "../../../../kit/text.js";

/** Where a fallback challenge checkpoint is in its life cycle. */
export type FallbackChallengeCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback challenge checkpoint and its current status. */
export class FallbackChallengeCheckpoint {
  code: string;
  name: string;
  durationMinutes: number;
  approved: boolean;
  weight: number;
  channel: string;
  ratio: number;
  segment: string;
  cost: number;
  archived: boolean;
  status: FallbackChallengeCheckpointStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    approved: boolean,
    weight: number,
    channel: string,
    ratio: number,
    segment: string,
    cost: number,
    archived: boolean,
    status: FallbackChallengeCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
    this.weight = weight;
    this.channel = channel;
    this.ratio = ratio;
    this.segment = segment;
    this.cost = cost;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackChallengeCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackChallengeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback challenge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback challenge checkpoint"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.cost - this.ratio) * 100) / 100;
  }

  copy(): FallbackChallengeCheckpoint {
    return new FallbackChallengeCheckpoint(
      this.code,
      this.name,
      this.durationMinutes,
      this.approved,
      this.weight,
      this.channel,
      this.ratio,
      this.segment,
      this.cost,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback challenge checkpoint in status new. */
export function newFallbackChallengeCheckpoint(code: string, name: string): FallbackChallengeCheckpoint {
  return new FallbackChallengeCheckpoint(code, name, 0, false, 0, "", 0, "", 0, false, "new");
}
