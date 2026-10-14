import * as text from "../../../../kit/text.js";

/** Where a rolling exit rule checkpoint is in its life cycle. */
export type RollingExitRuleCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A rolling exit rule checkpoint as the exit rule team keeps it. */
export class RollingExitRuleCheckpoint {
  code: string;
  name: string;
  amount: number;
  frequencyCap: number;
  revision: number;
  campaignRef: string;
  windowDays: number;
  createdAt: number;
  audienceId: string;
  title: string;
  status: RollingExitRuleCheckpointStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    frequencyCap: number,
    revision: number,
    campaignRef: string,
    windowDays: number,
    createdAt: number,
    audienceId: string,
    title: string,
    status: RollingExitRuleCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.revision = revision;
    this.campaignRef = campaignRef;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
    this.title = title;
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

  canMoveTo(next: RollingExitRuleCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingExitRuleCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling exit rule checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.amount + this.createdAt) * 100) / 100;
  }

  copy(): RollingExitRuleCheckpoint {
    return new RollingExitRuleCheckpoint(
      this.code,
      this.name,
      this.amount,
      this.frequencyCap,
      this.revision,
      this.campaignRef,
      this.windowDays,
      this.createdAt,
      this.audienceId,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling exit rule checkpoint in status created. */
export function newRollingExitRuleCheckpoint(code: string, name: string): RollingExitRuleCheckpoint {
  return new RollingExitRuleCheckpoint(code, name, 0, 0, 0, "", 0, 0, "", "", "created");
}
