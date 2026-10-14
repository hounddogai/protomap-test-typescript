import * as text from "../../../../kit/text.js";

/** Where a default pacing reservation is in its life cycle. */
export type DefaultPacingReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** One default pacing reservation, with what the planners need to act on it. */
export class DefaultPacingReservation {
  code: string;
  label: string;
  version: number;
  budget: number;
  amount: number;
  ratio: number;
  tags: string[];
  frequencyCap: number;
  quantity: number;
  weight: number;
  campaignRef: string;
  status: DefaultPacingReservationStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    budget: number,
    amount: number,
    ratio: number,
    tags: string[],
    frequencyCap: number,
    quantity: number,
    weight: number,
    campaignRef: string,
    status: DefaultPacingReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.budget = budget;
    this.amount = amount;
    this.ratio = ratio;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.weight = weight;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: DefaultPacingReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultPacingReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default pacing reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.weight + this.quantity) * 100) / 100;
  }

  copy(): DefaultPacingReservation {
    return new DefaultPacingReservation(
      this.code,
      this.label,
      this.version,
      this.budget,
      this.amount,
      this.ratio,
      this.tags,
      this.frequencyCap,
      this.quantity,
      this.weight,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default pacing reservation in status requested. */
export function newDefaultPacingReservation(code: string, label: string): DefaultPacingReservation {
  return new DefaultPacingReservation(code, label, 0, 0, 0, 0, [], 0, 0, 0, "", "requested");
}
