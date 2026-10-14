import * as text from "../../../../kit/text.js";

/** Where a pacing template is in its life cycle. */
export type PacingTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pacing template as the pacing team keeps it. */
export class PacingTemplate {
  code: string;
  title: string;
  windowDays: number;
  endsAt: number;
  durationMinutes: number;
  utmSource: string;
  batchSize: number;
  discount: number;
  visible: boolean;
  status: PacingTemplateStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    endsAt: number,
    durationMinutes: number,
    utmSource: string,
    batchSize: number,
    discount: number,
    visible: boolean,
    status: PacingTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.endsAt = endsAt;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.batchSize = batchSize;
    this.discount = discount;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PacingTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.durationMinutes - this.batchSize) * 100) / 100;
  }

  copy(): PacingTemplate {
    return new PacingTemplate(
      this.code,
      this.title,
      this.windowDays,
      this.endsAt,
      this.durationMinutes,
      this.utmSource,
      this.batchSize,
      this.discount,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pacing template in status proposed. */
export function newPacingTemplate(code: string, title: string): PacingTemplate {
  return new PacingTemplate(code, title, 0, 0, 0, "", 0, 0, false, "proposed");
}
