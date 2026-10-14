import * as text from "../../../../kit/text.js";

/** Where a creative checkpoint is in its life cycle. */
export type CreativeCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One creative checkpoint, with what the planners need to act on it. */
export class CreativeCheckpoint {
  code: string;
  name: string;
  createdAt: number;
  ownerId: string;
  revision: number;
  startsAt: number;
  cohort: string;
  approved: boolean;
  retries: number;
  status: CreativeCheckpointStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    ownerId: string,
    revision: number,
    startsAt: number,
    cohort: string,
    approved: boolean,
    retries: number,
    status: CreativeCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.revision = revision;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.approved = approved;
    this.retries = retries;
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

  canMoveTo(next: CreativeCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreativeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"creative checkpoint"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.retries + this.startsAt) * 100) / 100;
  }

  copy(): CreativeCheckpoint {
    return new CreativeCheckpoint(
      this.code,
      this.name,
      this.createdAt,
      this.ownerId,
      this.revision,
      this.startsAt,
      this.cohort,
      this.approved,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative checkpoint in status planned. */
export function newCreativeCheckpoint(code: string, name: string): CreativeCheckpoint {
  return new CreativeCheckpoint(code, name, 0, "", 0, 0, "", false, 0, "planned");
}
