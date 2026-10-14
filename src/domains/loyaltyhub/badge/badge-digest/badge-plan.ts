import * as text from "../../../../kit/text.js";

/** Where a badge plan is in its life cycle. */
export type BadgePlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A badge plan as the badge team keeps it. */
export class BadgePlan {
  code: string;
  label: string;
  locale: string;
  channel: string;
  utmSource: string;
  reviewer: string;
  source: string;
  sequence: number;
  ownerId: string;
  status: BadgePlanStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    channel: string,
    utmSource: string,
    reviewer: string,
    source: string,
    sequence: number,
    ownerId: string,
    status: BadgePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.channel = channel;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
    this.source = source;
    this.sequence = sequence;
    this.ownerId = ownerId;
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

  canMoveTo(next: BadgePlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BadgePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): BadgePlan {
    return new BadgePlan(
      this.code,
      this.label,
      this.locale,
      this.channel,
      this.utmSource,
      this.reviewer,
      this.source,
      this.sequence,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a badge plan in status requested. */
export function newBadgePlan(code: string, label: string): BadgePlan {
  return new BadgePlan(code, label, "", "", "", "", "", 0, "", "requested");
}
