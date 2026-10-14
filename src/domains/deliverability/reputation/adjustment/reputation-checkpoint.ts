import * as text from "../../../../kit/text.js";

/** Where a reputation checkpoint is in its life cycle. */
export type ReputationCheckpointStatus = "created" | "validated" | "published" | "retired";

/** The record of a reputation checkpoint and its current status. */
export class ReputationCheckpoint {
  code: string;
  title: string;
  active: boolean;
  notes: string;
  weight: number;
  region: string;
  summary: string;
  durationMinutes: number;
  description: string;
  pinned: boolean;
  label: string;
  status: ReputationCheckpointStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    notes: string,
    weight: number,
    region: string,
    summary: string,
    durationMinutes: number,
    description: string,
    pinned: boolean,
    label: string,
    status: ReputationCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.notes = notes;
    this.weight = weight;
    this.region = region;
    this.summary = summary;
    this.durationMinutes = durationMinutes;
    this.description = description;
    this.pinned = pinned;
    this.label = label;
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

  canMoveTo(next: ReputationCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ReputationCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round(this.weight * this.durationMinutes * 100) / 100;
  }

  copy(): ReputationCheckpoint {
    return new ReputationCheckpoint(
      this.code,
      this.title,
      this.active,
      this.notes,
      this.weight,
      this.region,
      this.summary,
      this.durationMinutes,
      this.description,
      this.pinned,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reputation checkpoint in status created. */
export function newReputationCheckpoint(code: string, title: string): ReputationCheckpoint {
  return new ReputationCheckpoint(code, title, false, "", 0, "", "", 0, "", false, "", "created");
}
