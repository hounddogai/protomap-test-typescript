import * as text from "../../../../kit/text.js";

/** Where a rolling proof manifest is in its life cycle. */
export type RollingProofManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling proof manifest as the proof team keeps it. */
export class RollingProofManifest {
  code: string;
  name: string;
  graceDays: number;
  amount: number;
  contactEmail: string;
  summary: string;
  audienceId: string;
  cost: number;
  status: RollingProofManifestStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    amount: number,
    contactEmail: string,
    summary: string,
    audienceId: string,
    cost: number,
    status: RollingProofManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.audienceId = audienceId;
    this.cost = cost;
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

  canMoveTo(next: RollingProofManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingProofManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling proof manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.graceDays - this.cost) * 100) / 100;
  }

  copy(): RollingProofManifest {
    return new RollingProofManifest(
      this.code,
      this.name,
      this.graceDays,
      this.amount,
      this.contactEmail,
      this.summary,
      this.audienceId,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling proof manifest in status proposed. */
export function newRollingProofManifest(code: string, name: string): RollingProofManifest {
  return new RollingProofManifest(code, name, 0, 0, "", "", "", 0, "proposed");
}
