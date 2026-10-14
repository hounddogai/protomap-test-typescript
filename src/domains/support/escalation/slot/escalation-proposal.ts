import * as text from "../../../../kit/text.js";

/** Where a escalation proposal is in its life cycle. */
export type EscalationProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A escalation proposal. Its code is unique within a tenant. */
export class EscalationProposal {
  code: string;
  label: string;
  notes: string;
  phone: string;
  unit: string;
  category: string;
  endsAt: number;
  active: boolean;
  status: EscalationProposalStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    phone: string,
    unit: string,
    category: string,
    endsAt: number,
    active: boolean,
    status: EscalationProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.phone = phone;
    this.unit = unit;
    this.category = category;
    this.endsAt = endsAt;
    this.active = active;
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

  canMoveTo(next: EscalationProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"escalation proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): EscalationProposal {
    return new EscalationProposal(
      this.code,
      this.label,
      this.notes,
      this.phone,
      this.unit,
      this.category,
      this.endsAt,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a escalation proposal in status requested. */
export function newEscalationProposal(code: string, label: string): EscalationProposal {
  return new EscalationProposal(code, label, "", "", "", "", 0, false, "requested");
}
