import * as text from "../../../../kit/text.js";

/** Where a window reservation is in its life cycle. */
export type WindowReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A window reservation as the window team keeps it. */
export class WindowReservation {
  code: string;
  label: string;
  sendAt: number;
  maximum: number;
  quantity: number;
  audienceId: string;
  locale: string;
  visible: boolean;
  timezone: string;
  checksum: string;
  segment: string;
  status: WindowReservationStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    maximum: number,
    quantity: number,
    audienceId: string,
    locale: string,
    visible: boolean,
    timezone: string,
    checksum: string,
    segment: string,
    status: WindowReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.maximum = maximum;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.locale = locale;
    this.visible = visible;
    this.timezone = timezone;
    this.checksum = checksum;
    this.segment = segment;
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

  canMoveTo(next: WindowReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
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

  moveTo(next: WindowReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"window reservation"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.sendAt - this.maximum) * 100) / 100;
  }

  copy(): WindowReservation {
    return new WindowReservation(
      this.code,
      this.label,
      this.sendAt,
      this.maximum,
      this.quantity,
      this.audienceId,
      this.locale,
      this.visible,
      this.timezone,
      this.checksum,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window reservation in status planned. */
export function newWindowReservation(code: string, label: string): WindowReservation {
  return new WindowReservation(code, label, 0, 0, 0, "", "", false, "", "", "", "planned");
}
