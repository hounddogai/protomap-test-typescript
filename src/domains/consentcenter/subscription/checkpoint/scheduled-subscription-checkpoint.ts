import * as text from "../../../../kit/text.js";

/** Where a scheduled subscription checkpoint is in its life cycle. */
export type ScheduledSubscriptionCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** One scheduled subscription checkpoint, with what the planners need to act on it. */
export class ScheduledSubscriptionCheckpoint {
  code: string;
  label: string;
  summary: string;
  durationMinutes: number;
  audienceId: string;
  status: ScheduledSubscriptionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    durationMinutes: number,
    audienceId: string,
    status: ScheduledSubscriptionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledSubscriptionCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledSubscriptionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled subscription checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled subscription checkpoint"} ${this.code}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): ScheduledSubscriptionCheckpoint {
    return new ScheduledSubscriptionCheckpoint(
      this.code,
      this.label,
      this.summary,
      this.durationMinutes,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled subscription checkpoint in status requested. */
export function newScheduledSubscriptionCheckpoint(code: string, label: string): ScheduledSubscriptionCheckpoint {
  return new ScheduledSubscriptionCheckpoint(code, label, "", 0, "", "requested");
}
