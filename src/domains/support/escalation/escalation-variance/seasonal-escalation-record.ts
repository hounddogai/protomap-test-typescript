import * as text from "../../../../kit/text.js";

/** Where a seasonal escalation record is in its life cycle. */
export type SeasonalEscalationRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** One seasonal escalation record, with what the planners need to act on it. */
export class SeasonalEscalationRecord {
  code: string;
  title: string;
  locale: string;
  channel: string;
  conversionRate: number;
  openRate: number;
  status: SeasonalEscalationRecordStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    channel: string,
    conversionRate: number,
    openRate: number,
    status: SeasonalEscalationRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalEscalationRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalEscalationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal escalation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal escalation record"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.openRate - this.conversionRate) * 100) / 100;
  }

  copy(): SeasonalEscalationRecord {
    return new SeasonalEscalationRecord(
      this.code,
      this.title,
      this.locale,
      this.channel,
      this.conversionRate,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal escalation record in status requested. */
export function newSeasonalEscalationRecord(code: string, title: string): SeasonalEscalationRecord {
  return new SeasonalEscalationRecord(code, title, "", "", 0, 0, "requested");
}
