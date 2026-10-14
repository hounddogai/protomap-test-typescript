import * as text from "../../../../kit/text.js";

/** Where a touchpoint target is in its life cycle. */
export type TouchpointTargetStatus = "created" | "validated" | "published" | "retired";

/** One touchpoint target, with what the planners need to act on it. */
export class TouchpointTarget {
  code: string;
  name: string;
  segment: string;
  impressions: number;
  attempts: number;
  locale: string;
  campaignRef: string;
  endsAt: number;
  contactEmail: string;
  audienceId: string;
  status: TouchpointTargetStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    impressions: number,
    attempts: number,
    locale: string,
    campaignRef: string,
    endsAt: number,
    contactEmail: string,
    audienceId: string,
    status: TouchpointTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.impressions = impressions;
    this.attempts = attempts;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.audienceId = audienceId;
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

  canMoveTo(next: TouchpointTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TouchpointTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.attempts + this.impressions) * 100) / 100;
  }

  copy(): TouchpointTarget {
    return new TouchpointTarget(
      this.code,
      this.name,
      this.segment,
      this.impressions,
      this.attempts,
      this.locale,
      this.campaignRef,
      this.endsAt,
      this.contactEmail,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a touchpoint target in status created. */
export function newTouchpointTarget(code: string, name: string): TouchpointTarget {
  return new TouchpointTarget(code, name, "", 0, 0, "", "", 0, "", "", "created");
}
