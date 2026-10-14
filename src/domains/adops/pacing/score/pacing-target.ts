import * as text from "../../../../kit/text.js";

/** Where a pacing target is in its life cycle. */
export type PacingTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a pacing target and its current status. */
export class PacingTarget {
  code: string;
  title: string;
  conversionRate: number;
  variant: string;
  currency: string;
  archived: boolean;
  ownerId: string;
  startsAt: number;
  audienceId: string;
  status: PacingTargetStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    variant: string,
    currency: string,
    archived: boolean,
    ownerId: string,
    startsAt: number,
    audienceId: string,
    status: PacingTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.variant = variant;
    this.currency = currency;
    this.archived = archived;
    this.ownerId = ownerId;
    this.startsAt = startsAt;
    this.audienceId = audienceId;
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

  canMoveTo(next: PacingTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PacingTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.startsAt + this.conversionRate) * 100) / 100;
  }

  copy(): PacingTarget {
    return new PacingTarget(
      this.code,
      this.title,
      this.conversionRate,
      this.variant,
      this.currency,
      this.archived,
      this.ownerId,
      this.startsAt,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pacing target in status proposed. */
export function newPacingTarget(code: string, title: string): PacingTarget {
  return new PacingTarget(code, title, 0, "", "", false, "", 0, "", "proposed");
}
