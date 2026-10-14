import * as text from "../../../../kit/text.js";

/** Where a complaint checkpoint is in its life cycle. */
export type ComplaintCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A complaint checkpoint. Its code is unique within a tenant. */
export class ComplaintCheckpoint {
  code: string;
  name: string;
  score: number;
  endsAt: number;
  weight: number;
  ownerId: string;
  limit: number;
  archived: boolean;
  status: ComplaintCheckpointStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    endsAt: number,
    weight: number,
    ownerId: string,
    limit: number,
    archived: boolean,
    status: ComplaintCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.endsAt = endsAt;
    this.weight = weight;
    this.ownerId = ownerId;
    this.limit = limit;
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

  canMoveTo(next: ComplaintCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: ComplaintCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.weight - this.limit) * 100) / 100;
  }

  copy(): ComplaintCheckpoint {
    return new ComplaintCheckpoint(
      this.code,
      this.name,
      this.score,
      this.endsAt,
      this.weight,
      this.ownerId,
      this.limit,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a complaint checkpoint in status draft. */
export function newComplaintCheckpoint(code: string, name: string): ComplaintCheckpoint {
  return new ComplaintCheckpoint(code, name, 0, 0, 0, "", 0, false, "draft");
}
