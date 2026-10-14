import * as text from "../../../../kit/text.js";

/** Where a escalation request is in its life cycle. */
export type EscalationRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One escalation request, with what the planners need to act on it. */
export class EscalationRequest {
  code: string;
  title: string;
  endsAt: number;
  phone: string;
  graceDays: number;
  visible: boolean;
  attempts: number;
  batchSize: number;
  status: EscalationRequestStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    phone: string,
    graceDays: number,
    visible: boolean,
    attempts: number,
    batchSize: number,
    status: EscalationRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.phone = phone;
    this.graceDays = graceDays;
    this.visible = visible;
    this.attempts = attempts;
    this.batchSize = batchSize;
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

  canMoveTo(next: EscalationRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EscalationRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.batchSize - this.attempts) * 100) / 100;
  }

  copy(): EscalationRequest {
    return new EscalationRequest(
      this.code,
      this.title,
      this.endsAt,
      this.phone,
      this.graceDays,
      this.visible,
      this.attempts,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a escalation request in status planned. */
export function newEscalationRequest(code: string, title: string): EscalationRequest {
  return new EscalationRequest(code, title, 0, "", 0, false, 0, 0, "planned");
}
