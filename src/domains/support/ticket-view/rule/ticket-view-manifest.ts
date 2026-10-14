import * as text from "../../../../kit/text.js";

/** Where a ticket view manifest is in its life cycle. */
export type TicketViewManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One ticket view manifest, with what the planners need to act on it. */
export class TicketViewManifest {
  code: string;
  label: string;
  weight: number;
  phone: string;
  sendAt: number;
  rate: number;
  frequencyCap: number;
  source: string;
  checksum: string;
  status: TicketViewManifestStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    phone: string,
    sendAt: number,
    rate: number,
    frequencyCap: number,
    source: string,
    checksum: string,
    status: TicketViewManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.phone = phone;
    this.sendAt = sendAt;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round(this.sendAt * this.rate * 100) / 100;
  }

  copy(): TicketViewManifest {
    return new TicketViewManifest(
      this.code,
      this.label,
      this.weight,
      this.phone,
      this.sendAt,
      this.rate,
      this.frequencyCap,
      this.source,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a ticket view manifest in status draft. */
export function newTicketViewManifest(code: string, label: string): TicketViewManifest {
  return new TicketViewManifest(code, label, 0, "", 0, 0, 0, "", "", "draft");
}
