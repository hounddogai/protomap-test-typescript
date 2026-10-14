import * as text from "../../../../kit/text.js";

/** Where a lenient suppression exception is in its life cycle. */
export type LenientSuppressionExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient suppression exception as the suppression team keeps it. */
export class LenientSuppressionException {
  code: string;
  title: string;
  description: string;
  journeyId: string;
  endsAt: number;
  channel: string;
  status: LenientSuppressionExceptionStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    journeyId: string,
    endsAt: number,
    channel: string,
    status: LenientSuppressionExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.journeyId = journeyId;
    this.endsAt = endsAt;
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

  canMoveTo(next: LenientSuppressionExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientSuppressionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient suppression exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): LenientSuppressionException {
    return new LenientSuppressionException(
      this.code,
      this.title,
      this.description,
      this.journeyId,
      this.endsAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient suppression exception in status planned. */
export function newLenientSuppressionException(code: string, title: string): LenientSuppressionException {
  return new LenientSuppressionException(code, title, "", "", 0, "", "planned");
}
