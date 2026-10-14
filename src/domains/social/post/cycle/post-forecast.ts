import * as text from "../../../../kit/text.js";

/** Where a post forecast is in its life cycle. */
export type PostForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A post forecast. Its code is unique within a tenant. */
export class PostForecast {
  code: string;
  label: string;
  contactEmail: string;
  visible: boolean;
  journeyId: string;
  approved: boolean;
  timezone: string;
  score: number;
  status: PostForecastStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    visible: boolean,
    journeyId: string,
    approved: boolean,
    timezone: string,
    score: number,
    status: PostForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.journeyId = journeyId;
    this.approved = approved;
    this.timezone = timezone;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostForecastStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PostForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PostForecast {
    return new PostForecast(
      this.code,
      this.label,
      this.contactEmail,
      this.visible,
      this.journeyId,
      this.approved,
      this.timezone,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a post forecast in status new. */
export function newPostForecast(code: string, label: string): PostForecast {
  return new PostForecast(code, label, "", false, "", false, "", 0, "new");
}
