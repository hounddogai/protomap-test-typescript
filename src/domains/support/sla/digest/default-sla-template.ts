import * as text from "../../../../kit/text.js";

/** Where a default sla template is in its life cycle. */
export type DefaultSlaTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default sla template and its current status. */
export class DefaultSlaTemplate {
  code: string;
  title: string;
  minimum: number;
  bid: number;
  maximum: number;
  locale: string;
  attempts: number;
  unit: string;
  floorValue: number;
  channel: string;
  source: string;
  status: DefaultSlaTemplateStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    bid: number,
    maximum: number,
    locale: string,
    attempts: number,
    unit: string,
    floorValue: number,
    channel: string,
    source: string,
    status: DefaultSlaTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.bid = bid;
    this.maximum = maximum;
    this.locale = locale;
    this.attempts = attempts;
    this.unit = unit;
    this.floorValue = floorValue;
    this.channel = channel;
    this.source = source;
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

  canMoveTo(next: DefaultSlaTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: DefaultSlaTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sla template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round(this.maximum * this.minimum * 100) / 100;
  }

  copy(): DefaultSlaTemplate {
    return new DefaultSlaTemplate(
      this.code,
      this.title,
      this.minimum,
      this.bid,
      this.maximum,
      this.locale,
      this.attempts,
      this.unit,
      this.floorValue,
      this.channel,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default sla template in status proposed. */
export function newDefaultSlaTemplate(code: string, title: string): DefaultSlaTemplate {
  return new DefaultSlaTemplate(code, title, 0, 0, 0, "", 0, "", 0, "", "", "proposed");
}
