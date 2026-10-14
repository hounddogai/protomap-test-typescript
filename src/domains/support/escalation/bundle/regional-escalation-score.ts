import * as text from "../../../../kit/text.js";

/** Where a regional escalation score is in its life cycle. */
export type RegionalEscalationScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a regional escalation score and its current status. */
export class RegionalEscalationScore {
  code: string;
  title: string;
  createdAt: number;
  journeyId: string;
  locale: string;
  ceiling: number;
  ownerId: string;
  status: RegionalEscalationScoreStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    journeyId: string,
    locale: string,
    ceiling: number,
    ownerId: string,
    status: RegionalEscalationScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.locale = locale;
    this.ceiling = ceiling;
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

  canMoveTo(next: RegionalEscalationScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalEscalationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional escalation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.ceiling + this.createdAt) * 100) / 100;
  }

  copy(): RegionalEscalationScore {
    return new RegionalEscalationScore(
      this.code,
      this.title,
      this.createdAt,
      this.journeyId,
      this.locale,
      this.ceiling,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional escalation score in status requested. */
export function newRegionalEscalationScore(code: string, title: string): RegionalEscalationScore {
  return new RegionalEscalationScore(code, title, 0, "", "", 0, "", "requested");
}
