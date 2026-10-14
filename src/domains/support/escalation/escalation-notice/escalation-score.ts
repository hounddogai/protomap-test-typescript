import * as text from "../../../../kit/text.js";

/** Where a escalation score is in its life cycle. */
export type EscalationScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** A escalation score. Its code is unique within a tenant. */
export class EscalationScore {
  code: string;
  label: string;
  channel: string;
  revision: number;
  region: string;
  status: EscalationScoreStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    revision: number,
    region: string,
    status: EscalationScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.revision = revision;
    this.region = region;
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

  canMoveTo(next: EscalationScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
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

  moveTo(next: EscalationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"escalation score"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): EscalationScore {
    return new EscalationScore(this.code, this.label, this.channel, this.revision, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a escalation score in status requested. */
export function newEscalationScore(code: string, label: string): EscalationScore {
  return new EscalationScore(code, label, "", 0, "", "requested");
}
