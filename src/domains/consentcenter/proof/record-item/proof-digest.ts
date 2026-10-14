import * as text from "../../../../kit/text.js";

/** Where a proof digest is in its life cycle. */
export type ProofDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A proof digest as the proof team keeps it. */
export class ProofDigest {
  code: string;
  name: string;
  durationMinutes: number;
  region: string;
  revision: number;
  externalRef: string;
  variant: string;
  capacity: number;
  phone: string;
  channel: string;
  unit: string;
  status: ProofDigestStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    region: string,
    revision: number,
    externalRef: string,
    variant: string,
    capacity: number,
    phone: string,
    channel: string,
    unit: string,
    status: ProofDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.revision = revision;
    this.externalRef = externalRef;
    this.variant = variant;
    this.capacity = capacity;
    this.phone = phone;
    this.channel = channel;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ProofDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.capacity + this.revision) * 100) / 100;
  }

  copy(): ProofDigest {
    return new ProofDigest(
      this.code,
      this.name,
      this.durationMinutes,
      this.region,
      this.revision,
      this.externalRef,
      this.variant,
      this.capacity,
      this.phone,
      this.channel,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a proof digest in status open. */
export function newProofDigest(code: string, name: string): ProofDigest {
  return new ProofDigest(code, name, 0, "", 0, "", "", 0, "", "", "", "open");
}
