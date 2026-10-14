import * as text from "../../../../kit/text.js";

/** Where a default escalation score is in its life cycle. */
export type DefaultEscalationScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default escalation score as the escalation team keeps it. */
export class DefaultEscalationScore {
  code: string;
  name: string;
  floorValue: number;
  externalRef: string;
  amount: number;
  audienceId: string;
  title: string;
  status: DefaultEscalationScoreStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    externalRef: string,
    amount: number,
    audienceId: string,
    title: string,
    status: DefaultEscalationScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.externalRef = externalRef;
    this.amount = amount;
    this.audienceId = audienceId;
    this.title = title;
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

  canMoveTo(next: DefaultEscalationScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultEscalationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default escalation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round(this.amount * this.floorValue * 100) / 100;
  }

  copy(): DefaultEscalationScore {
    return new DefaultEscalationScore(
      this.code,
      this.name,
      this.floorValue,
      this.externalRef,
      this.amount,
      this.audienceId,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default escalation score in status proposed. */
export function newDefaultEscalationScore(code: string, name: string): DefaultEscalationScore {
  return new DefaultEscalationScore(code, name, 0, "", 0, "", "", "proposed");
}
