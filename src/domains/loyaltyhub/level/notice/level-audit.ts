import * as text from "../../../../kit/text.js";

/** Where a level audit is in its life cycle. */
export type LevelAuditStatus = "created" | "validated" | "published" | "retired";

/** A level audit as the level team keeps it. */
export class LevelAudit {
  code: string;
  label: string;
  score: number;
  channel: string;
  limit: number;
  margin: number;
  ownerId: string;
  unit: string;
  createdAt: number;
  status: LevelAuditStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    channel: string,
    limit: number,
    margin: number,
    ownerId: string,
    unit: string,
    createdAt: number,
    status: LevelAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.channel = channel;
    this.limit = limit;
    this.margin = margin;
    this.ownerId = ownerId;
    this.unit = unit;
    this.createdAt = createdAt;
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

  canMoveTo(next: LevelAuditStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round(this.score * this.createdAt * 100) / 100;
  }

  copy(): LevelAudit {
    return new LevelAudit(
      this.code,
      this.label,
      this.score,
      this.channel,
      this.limit,
      this.margin,
      this.ownerId,
      this.unit,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a level audit in status created. */
export function newLevelAudit(code: string, label: string): LevelAudit {
  return new LevelAudit(code, label, 0, "", 0, 0, "", "", 0, "created");
}
