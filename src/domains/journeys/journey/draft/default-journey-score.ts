import * as text from "../../../../kit/text.js";

/** Where a default journey score is in its life cycle. */
export type DefaultJourneyScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A default journey score. Its code is unique within a tenant. */
export class DefaultJourneyScore {
  code: string;
  name: string;
  locale: string;
  externalRef: string;
  active: boolean;
  description: string;
  journeyId: string;
  notes: string;
  quantity: number;
  status: DefaultJourneyScoreStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    externalRef: string,
    active: boolean,
    description: string,
    journeyId: string,
    notes: string,
    quantity: number,
    status: DefaultJourneyScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.externalRef = externalRef;
    this.active = active;
    this.description = description;
    this.journeyId = journeyId;
    this.notes = notes;
    this.quantity = quantity;
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

  canMoveTo(next: DefaultJourneyScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultJourneyScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default journey score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default journey score"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): DefaultJourneyScore {
    return new DefaultJourneyScore(
      this.code,
      this.name,
      this.locale,
      this.externalRef,
      this.active,
      this.description,
      this.journeyId,
      this.notes,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default journey score in status requested. */
export function newDefaultJourneyScore(code: string, name: string): DefaultJourneyScore {
  return new DefaultJourneyScore(code, name, "", "", false, "", "", "", 0, "requested");
}
