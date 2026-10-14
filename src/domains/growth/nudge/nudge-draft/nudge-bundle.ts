import * as text from "../../../../kit/text.js";

/** Where a nudge bundle is in its life cycle. */
export type NudgeBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One nudge bundle, with what the planners need to act on it. */
export class NudgeBundle {
  code: string;
  title: string;
  score: number;
  source: string;
  active: boolean;
  pinned: boolean;
  amount: number;
  sendAt: number;
  status: NudgeBundleStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    source: string,
    active: boolean,
    pinned: boolean,
    amount: number,
    sendAt: number,
    status: NudgeBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.source = source;
    this.active = active;
    this.pinned = pinned;
    this.amount = amount;
    this.sendAt = sendAt;
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

  canMoveTo(next: NudgeBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.amount - this.sendAt) * 100) / 100;
  }

  copy(): NudgeBundle {
    return new NudgeBundle(
      this.code,
      this.title,
      this.score,
      this.source,
      this.active,
      this.pinned,
      this.amount,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a nudge bundle in status proposed. */
export function newNudgeBundle(code: string, title: string): NudgeBundle {
  return new NudgeBundle(code, title, 0, "", false, false, 0, 0, "proposed");
}
