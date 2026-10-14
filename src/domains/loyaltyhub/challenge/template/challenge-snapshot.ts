import * as text from "../../../../kit/text.js";

/** Where a challenge snapshot is in its life cycle. */
export type ChallengeSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A challenge snapshot. Its code is unique within a tenant. */
export class ChallengeSnapshot {
  code: string;
  title: string;
  retries: number;
  category: string;
  journeyId: string;
  visible: boolean;
  variant: string;
  status: ChallengeSnapshotStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    category: string,
    journeyId: string,
    visible: boolean,
    variant: string,
    status: ChallengeSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.category = category;
    this.journeyId = journeyId;
    this.visible = visible;
    this.variant = variant;
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

  canMoveTo(next: ChallengeSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): ChallengeSnapshot {
    return new ChallengeSnapshot(
      this.code,
      this.title,
      this.retries,
      this.category,
      this.journeyId,
      this.visible,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a challenge snapshot in status planned. */
export function newChallengeSnapshot(code: string, title: string): ChallengeSnapshot {
  return new ChallengeSnapshot(code, title, 0, "", "", false, "", "planned");
}
