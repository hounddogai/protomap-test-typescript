import * as text from "../../../../kit/text.js";

/** Where a fallback journey review is in its life cycle. */
export type FallbackJourneyReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One fallback journey review, with what the planners need to act on it. */
export class FallbackJourneyReview {
  code: string;
  name: string;
  durationMinutes: number;
  visible: boolean;
  channel: string;
  status: FallbackJourneyReviewStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    visible: boolean,
    channel: string,
    status: FallbackJourneyReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
    this.channel = channel;
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

  canMoveTo(next: FallbackJourneyReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackJourneyReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback journey review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback journey review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): FallbackJourneyReview {
    return new FallbackJourneyReview(
      this.code,
      this.name,
      this.durationMinutes,
      this.visible,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback journey review in status planned. */
export function newFallbackJourneyReview(code: string, name: string): FallbackJourneyReview {
  return new FallbackJourneyReview(code, name, 0, false, "", "planned");
}
