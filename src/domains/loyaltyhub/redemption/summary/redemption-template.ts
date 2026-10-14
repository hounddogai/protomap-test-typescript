import * as text from "../../../../kit/text.js";

/** Where a redemption template is in its life cycle. */
export type RedemptionTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A redemption template. Its code is unique within a tenant. */
export class RedemptionTemplate {
  code: string;
  title: string;
  updatedAt: number;
  description: string;
  startsAt: number;
  channel: string;
  status: RedemptionTemplateStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    description: string,
    startsAt: number,
    channel: string,
    status: RedemptionTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.description = description;
    this.startsAt = startsAt;
    this.channel = channel;
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

  canMoveTo(next: RedemptionTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.updatedAt - this.startsAt) * 100) / 100;
  }

  copy(): RedemptionTemplate {
    return new RedemptionTemplate(
      this.code,
      this.title,
      this.updatedAt,
      this.description,
      this.startsAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a redemption template in status proposed. */
export function newRedemptionTemplate(code: string, title: string): RedemptionTemplate {
  return new RedemptionTemplate(code, title, 0, "", 0, "", "proposed");
}
