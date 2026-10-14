import * as text from "../../../../kit/text.js";

/** Where a funnel agreement is in its life cycle. */
export type FunnelAgreementStatus = "created" | "validated" | "published" | "retired";

/** A funnel agreement as the funnel team keeps it. */
export class FunnelAgreement {
  code: string;
  name: string;
  channel: string;
  cohort: string;
  revision: number;
  status: FunnelAgreementStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    cohort: string,
    revision: number,
    status: FunnelAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.cohort = cohort;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FunnelAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): FunnelAgreement {
    return new FunnelAgreement(this.code, this.name, this.channel, this.cohort, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a funnel agreement in status created. */
export function newFunnelAgreement(code: string, name: string): FunnelAgreement {
  return new FunnelAgreement(code, name, "", "", 0, "created");
}
