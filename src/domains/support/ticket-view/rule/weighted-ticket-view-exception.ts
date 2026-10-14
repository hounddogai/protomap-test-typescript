import * as text from "../../../../kit/text.js";

/** Where a weighted ticket view exception is in its life cycle. */
export type WeightedTicketViewExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted ticket view exception. Its code is unique within a tenant. */
export class WeightedTicketViewException {
  code: string;
  title: string;
  locale: string;
  contactEmail: string;
  score: number;
  status: WeightedTicketViewExceptionStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    contactEmail: string,
    score: number,
    status: WeightedTicketViewExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.score = score;
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

  canMoveTo(next: WeightedTicketViewExceptionStatus): boolean {
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

  moveTo(next: WeightedTicketViewExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted ticket view exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WeightedTicketViewException {
    return new WeightedTicketViewException(
      this.code,
      this.title,
      this.locale,
      this.contactEmail,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted ticket view exception in status proposed. */
export function newWeightedTicketViewException(code: string, title: string): WeightedTicketViewException {
  return new WeightedTicketViewException(code, title, "", "", 0, "proposed");
}
