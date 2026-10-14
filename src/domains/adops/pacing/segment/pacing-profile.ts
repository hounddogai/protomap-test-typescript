import * as text from "../../../../kit/text.js";

/** Where a pacing profile is in its life cycle. */
export type PacingProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pacing profile. Its code is unique within a tenant. */
export class PacingProfile {
  code: string;
  title: string;
  sendAt: number;
  startsAt: number;
  reviewer: string;
  externalRef: string;
  locale: string;
  score: number;
  cost: number;
  phone: string;
  active: boolean;
  status: PacingProfileStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    startsAt: number,
    reviewer: string,
    externalRef: string,
    locale: string,
    score: number,
    cost: number,
    phone: string,
    active: boolean,
    status: PacingProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.locale = locale;
    this.score = score;
    this.cost = cost;
    this.phone = phone;
    this.active = active;
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

  canMoveTo(next: PacingProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PacingProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round((this.sendAt - this.startsAt) * 100) / 100;
  }

  copy(): PacingProfile {
    return new PacingProfile(
      this.code,
      this.title,
      this.sendAt,
      this.startsAt,
      this.reviewer,
      this.externalRef,
      this.locale,
      this.score,
      this.cost,
      this.phone,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pacing profile in status planned. */
export function newPacingProfile(code: string, title: string): PacingProfile {
  return new PacingProfile(code, title, 0, 0, "", "", "", 0, 0, "", false, "planned");
}
