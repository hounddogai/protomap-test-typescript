import * as text from "../../../../kit/text.js";

/** Where a opt out checkpoint is in its life cycle. */
export type OptOutCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One opt out checkpoint, with what the planners need to act on it. */
export class OptOutCheckpoint {
  code: string;
  name: string;
  sendAt: number;
  updatedAt: number;
  revision: number;
  reviewer: string;
  limit: number;
  budget: number;
  priority: number;
  openRate: number;
  minimum: number;
  status: OptOutCheckpointStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    updatedAt: number,
    revision: number,
    reviewer: string,
    limit: number,
    budget: number,
    priority: number,
    openRate: number,
    minimum: number,
    status: OptOutCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.updatedAt = updatedAt;
    this.revision = revision;
    this.reviewer = reviewer;
    this.limit = limit;
    this.budget = budget;
    this.priority = priority;
    this.openRate = openRate;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: OptOutCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"opt out checkpoint"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.minimum - this.openRate) * 100) / 100;
  }

  copy(): OptOutCheckpoint {
    return new OptOutCheckpoint(
      this.code,
      this.name,
      this.sendAt,
      this.updatedAt,
      this.revision,
      this.reviewer,
      this.limit,
      this.budget,
      this.priority,
      this.openRate,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a opt out checkpoint in status proposed. */
export function newOptOutCheckpoint(code: string, name: string): OptOutCheckpoint {
  return new OptOutCheckpoint(code, name, 0, 0, 0, "", 0, 0, 0, 0, 0, "proposed");
}
