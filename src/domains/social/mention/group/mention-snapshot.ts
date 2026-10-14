import * as text from "../../../../kit/text.js";

/** Where a mention snapshot is in its life cycle. */
export type MentionSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One mention snapshot, with what the planners need to act on it. */
export class MentionSnapshot {
  code: string;
  title: string;
  discount: number;
  weight: number;
  approved: boolean;
  channel: string;
  ratio: number;
  cohort: string;
  status: MentionSnapshotStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    weight: number,
    approved: boolean,
    channel: string,
    ratio: number,
    cohort: string,
    status: MentionSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.weight = weight;
    this.approved = approved;
    this.channel = channel;
    this.ratio = ratio;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.discount * this.weight * 100) / 100;
  }

  copy(): MentionSnapshot {
    return new MentionSnapshot(
      this.code,
      this.title,
      this.discount,
      this.weight,
      this.approved,
      this.channel,
      this.ratio,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a mention snapshot in status idle. */
export function newMentionSnapshot(code: string, title: string): MentionSnapshot {
  return new MentionSnapshot(code, title, 0, 0, false, "", 0, "", "idle");
}
