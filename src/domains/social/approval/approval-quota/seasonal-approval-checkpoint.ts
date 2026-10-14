import * as text from "../../../../kit/text.js";

/** Where a seasonal approval checkpoint is in its life cycle. */
export type SeasonalApprovalCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal approval checkpoint, with what the planners need to act on it. */
export class SeasonalApprovalCheckpoint {
  code: string;
  label: string;
  margin: number;
  graceDays: number;
  channel: string;
  status: SeasonalApprovalCheckpointStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    graceDays: number,
    channel: string,
    status: SeasonalApprovalCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.graceDays = graceDays;
    this.channel = channel;
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

  canMoveTo(next: SeasonalApprovalCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalApprovalCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal approval checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal approval checkpoint"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.graceDays + this.margin) * 100) / 100;
  }

  copy(): SeasonalApprovalCheckpoint {
    return new SeasonalApprovalCheckpoint(
      this.code,
      this.label,
      this.margin,
      this.graceDays,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal approval checkpoint in status draft. */
export function newSeasonalApprovalCheckpoint(code: string, label: string): SeasonalApprovalCheckpoint {
  return new SeasonalApprovalCheckpoint(code, label, 0, 0, "", "draft");
}
