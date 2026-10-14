import * as text from "../../../../kit/text.js";

/** Where a primary pacing plan is in its life cycle. */
export type PrimaryPacingPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary pacing plan as the pacing team keeps it. */
export class PrimaryPacingPlan {
  code: string;
  title: string;
  attempts: number;
  durationMinutes: number;
  score: number;
  visible: boolean;
  audienceId: string;
  limit: number;
  endsAt: number;
  status: PrimaryPacingPlanStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    durationMinutes: number,
    score: number,
    visible: boolean,
    audienceId: string,
    limit: number,
    endsAt: number,
    status: PrimaryPacingPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.visible = visible;
    this.audienceId = audienceId;
    this.limit = limit;
    this.endsAt = endsAt;
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

  canMoveTo(next: PrimaryPacingPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryPacingPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary pacing plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary pacing plan"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.durationMinutes + this.attempts) * 100) / 100;
  }

  copy(): PrimaryPacingPlan {
    return new PrimaryPacingPlan(
      this.code,
      this.title,
      this.attempts,
      this.durationMinutes,
      this.score,
      this.visible,
      this.audienceId,
      this.limit,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary pacing plan in status draft. */
export function newPrimaryPacingPlan(code: string, title: string): PrimaryPacingPlan {
  return new PrimaryPacingPlan(code, title, 0, 0, 0, false, "", 0, 0, "draft");
}
