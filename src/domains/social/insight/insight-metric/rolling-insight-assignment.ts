import * as text from "../../../../kit/text.js";

/** Where a rolling insight assignment is in its life cycle. */
export type RollingInsightAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling insight assignment. Its code is unique within a tenant. */
export class RollingInsightAssignment {
  code: string;
  name: string;
  locale: string;
  startsAt: number;
  visible: boolean;
  conversionRate: number;
  campaignRef: string;
  minimum: number;
  reviewer: string;
  phone: string;
  channel: string;
  status: RollingInsightAssignmentStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    startsAt: number,
    visible: boolean,
    conversionRate: number,
    campaignRef: string,
    minimum: number,
    reviewer: string,
    phone: string,
    channel: string,
    status: RollingInsightAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.startsAt = startsAt;
    this.visible = visible;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.reviewer = reviewer;
    this.phone = phone;
    this.channel = channel;
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

  canMoveTo(next: RollingInsightAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingInsightAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling insight assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.startsAt + this.minimum) * 100) / 100;
  }

  copy(): RollingInsightAssignment {
    return new RollingInsightAssignment(
      this.code,
      this.name,
      this.locale,
      this.startsAt,
      this.visible,
      this.conversionRate,
      this.campaignRef,
      this.minimum,
      this.reviewer,
      this.phone,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling insight assignment in status requested. */
export function newRollingInsightAssignment(code: string, name: string): RollingInsightAssignment {
  return new RollingInsightAssignment(code, name, "", 0, false, 0, "", 0, "", "", "", "requested");
}
