import * as text from "../../../../kit/text.js";

/** Where a sender schedule is in its life cycle. */
export type SenderScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sender schedule as the sender team keeps it. */
export class SenderSchedule {
  code: string;
  name: string;
  expiresAt: number;
  graceDays: number;
  sequence: number;
  weight: number;
  summary: string;
  sendAt: number;
  startsAt: number;
  createdAt: number;
  visible: boolean;
  status: SenderScheduleStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    graceDays: number,
    sequence: number,
    weight: number,
    summary: string,
    sendAt: number,
    startsAt: number,
    createdAt: number,
    visible: boolean,
    status: SenderScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.weight = weight;
    this.summary = summary;
    this.sendAt = sendAt;
    this.startsAt = startsAt;
    this.createdAt = createdAt;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"sender schedule"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sequence + this.weight) * 100) / 100;
  }

  copy(): SenderSchedule {
    return new SenderSchedule(
      this.code,
      this.name,
      this.expiresAt,
      this.graceDays,
      this.sequence,
      this.weight,
      this.summary,
      this.sendAt,
      this.startsAt,
      this.createdAt,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sender schedule in status open. */
export function newSenderSchedule(code: string, name: string): SenderSchedule {
  return new SenderSchedule(code, name, 0, 0, 0, 0, "", 0, 0, 0, false, "open");
}
