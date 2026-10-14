import * as text from "../../../../kit/text.js";

/** Where a proof mapping is in its life cycle. */
export type ProofMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One proof mapping, with what the planners need to act on it. */
export class ProofMapping {
  code: string;
  label: string;
  openRate: number;
  conversionRate: number;
  segment: string;
  threshold: number;
  ratio: number;
  minimum: number;
  startsAt: number;
  sendAt: number;
  status: ProofMappingStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    conversionRate: number,
    segment: string,
    threshold: number,
    ratio: number,
    minimum: number,
    startsAt: number,
    sendAt: number,
    status: ProofMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.conversionRate = conversionRate;
    this.segment = segment;
    this.threshold = threshold;
    this.ratio = ratio;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.sendAt = sendAt;
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

  canMoveTo(next: ProofMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
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

  moveTo(next: ProofMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netValue(): number {
    return Math.round((this.ratio - this.conversionRate) * 100) / 100;
  }

  copy(): ProofMapping {
    return new ProofMapping(
      this.code,
      this.label,
      this.openRate,
      this.conversionRate,
      this.segment,
      this.threshold,
      this.ratio,
      this.minimum,
      this.startsAt,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a proof mapping in status proposed. */
export function newProofMapping(code: string, label: string): ProofMapping {
  return new ProofMapping(code, label, 0, 0, "", 0, 0, 0, 0, 0, "proposed");
}
