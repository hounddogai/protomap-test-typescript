import * as text from "../../../../kit/text.js";

/** Where a proof agreement is in its life cycle. */
export type ProofAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A proof agreement as the proof team keeps it. */
export class ProofAgreement {
  code: string;
  name: string;
  summary: string;
  channel: string;
  timezone: string;
  bid: number;
  windowDays: number;
  checksum: string;
  durationMinutes: number;
  status: ProofAgreementStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    channel: string,
    timezone: string,
    bid: number,
    windowDays: number,
    checksum: string,
    durationMinutes: number,
    status: ProofAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.channel = channel;
    this.timezone = timezone;
    this.bid = bid;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ProofAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ProofAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"proof agreement"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.durationMinutes + this.bid) * 100) / 100;
  }

  copy(): ProofAgreement {
    return new ProofAgreement(
      this.code,
      this.name,
      this.summary,
      this.channel,
      this.timezone,
      this.bid,
      this.windowDays,
      this.checksum,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a proof agreement in status proposed. */
export function newProofAgreement(code: string, name: string): ProofAgreement {
  return new ProofAgreement(code, name, "", "", "", 0, 0, "", 0, "proposed");
}
