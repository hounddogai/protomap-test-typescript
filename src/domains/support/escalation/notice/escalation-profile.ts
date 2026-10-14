import * as text from "../../../../kit/text.js";

/** Where a escalation profile is in its life cycle. */
export type EscalationProfileStatus = "created" | "validated" | "published" | "retired";

/** A escalation profile. Its code is unique within a tenant. */
export class EscalationProfile {
  code: string;
  title: string;
  cost: number;
  region: string;
  durationMinutes: number;
  endsAt: number;
  status: EscalationProfileStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    region: string,
    durationMinutes: number,
    endsAt: number,
    status: EscalationProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
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

  canMoveTo(next: EscalationProfileStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: EscalationProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.cost * this.durationMinutes * 100) / 100;
  }

  copy(): EscalationProfile {
    return new EscalationProfile(
      this.code,
      this.title,
      this.cost,
      this.region,
      this.durationMinutes,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a escalation profile in status created. */
export function newEscalationProfile(code: string, title: string): EscalationProfile {
  return new EscalationProfile(code, title, 0, "", 0, 0, "created");
}
