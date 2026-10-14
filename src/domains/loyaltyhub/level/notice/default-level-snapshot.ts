import * as text from "../../../../kit/text.js";

/** Where a default level snapshot is in its life cycle. */
export type DefaultLevelSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default level snapshot, with what the planners need to act on it. */
export class DefaultLevelSnapshot {
  code: string;
  title: string;
  amount: number;
  limit: number;
  ownerId: string;
  durationMinutes: number;
  score: number;
  graceDays: number;
  status: DefaultLevelSnapshotStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    limit: number,
    ownerId: string,
    durationMinutes: number,
    score: number,
    graceDays: number,
    status: DefaultLevelSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.limit = limit;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.graceDays = graceDays;
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

  canMoveTo(next: DefaultLevelSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultLevelSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default level snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round(this.graceDays * this.durationMinutes * 100) / 100;
  }

  copy(): DefaultLevelSnapshot {
    return new DefaultLevelSnapshot(
      this.code,
      this.title,
      this.amount,
      this.limit,
      this.ownerId,
      this.durationMinutes,
      this.score,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default level snapshot in status planned. */
export function newDefaultLevelSnapshot(code: string, title: string): DefaultLevelSnapshot {
  return new DefaultLevelSnapshot(code, title, 0, 0, "", 0, 0, 0, "planned");
}
