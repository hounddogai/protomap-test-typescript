import * as text from "../../../../kit/text.js";

/** Where a journey review is in its life cycle. */
export type JourneyReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One journey review, with what the planners need to act on it. */
export class JourneyReview {
  code: string;
  title: string;
  audienceId: string;
  description: string;
  cost: number;
  sequence: number;
  visible: boolean;
  status: JourneyReviewStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    description: string,
    cost: number,
    sequence: number,
    visible: boolean,
    status: JourneyReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.description = description;
    this.cost = cost;
    this.sequence = sequence;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneyReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netVolume(): number {
    return Math.round(this.cost * this.sequence * 100) / 100;
  }

  copy(): JourneyReview {
    return new JourneyReview(
      this.code,
      this.title,
      this.audienceId,
      this.description,
      this.cost,
      this.sequence,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a journey review in status idle. */
export function newJourneyReview(code: string, title: string): JourneyReview {
  return new JourneyReview(code, title, "", "", 0, 0, false, "idle");
}
