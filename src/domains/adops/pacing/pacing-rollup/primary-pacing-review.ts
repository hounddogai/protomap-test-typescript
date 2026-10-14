import * as text from "../../../../kit/text.js";

/** Where a primary pacing review is in its life cycle. */
export type PrimaryPacingReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary pacing review as the pacing team keeps it. */
export class PrimaryPacingReview {
  code: string;
  title: string;
  floorValue: number;
  visible: boolean;
  channel: string;
  cohort: string;
  phone: string;
  description: string;
  budget: number;
  startsAt: number;
  checksum: string;
  status: PrimaryPacingReviewStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    visible: boolean,
    channel: string,
    cohort: string,
    phone: string,
    description: string,
    budget: number,
    startsAt: number,
    checksum: string,
    status: PrimaryPacingReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.visible = visible;
    this.channel = channel;
    this.cohort = cohort;
    this.phone = phone;
    this.description = description;
    this.budget = budget;
    this.startsAt = startsAt;
    this.checksum = checksum;
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

  canMoveTo(next: PrimaryPacingReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryPacingReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary pacing review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.startsAt + this.budget) * 100) / 100;
  }

  copy(): PrimaryPacingReview {
    return new PrimaryPacingReview(
      this.code,
      this.title,
      this.floorValue,
      this.visible,
      this.channel,
      this.cohort,
      this.phone,
      this.description,
      this.budget,
      this.startsAt,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary pacing review in status draft. */
export function newPrimaryPacingReview(code: string, title: string): PrimaryPacingReview {
  return new PrimaryPacingReview(code, title, 0, false, "", "", "", "", 0, 0, "", "draft");
}
