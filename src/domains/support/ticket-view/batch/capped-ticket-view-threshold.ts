import * as text from "../../../../kit/text.js";

/** Where a capped ticket view threshold is in its life cycle. */
export type CappedTicketViewThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped ticket view threshold. Its code is unique within a tenant. */
export class CappedTicketViewThreshold {
  code: string;
  label: string;
  tags: string[];
  utmSource: string;
  frequencyCap: number;
  sequence: number;
  capacity: number;
  ratio: number;
  status: CappedTicketViewThresholdStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    utmSource: string,
    frequencyCap: number,
    sequence: number,
    capacity: number,
    ratio: number,
    status: CappedTicketViewThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.utmSource = utmSource;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.capacity = capacity;
    this.ratio = ratio;
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

  canMoveTo(next: CappedTicketViewThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedTicketViewThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped ticket view threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped ticket view threshold"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round(this.frequencyCap * this.ratio * 100) / 100;
  }

  copy(): CappedTicketViewThreshold {
    return new CappedTicketViewThreshold(
      this.code,
      this.label,
      this.tags,
      this.utmSource,
      this.frequencyCap,
      this.sequence,
      this.capacity,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped ticket view threshold in status requested. */
export function newCappedTicketViewThreshold(code: string, label: string): CappedTicketViewThreshold {
  return new CappedTicketViewThreshold(code, label, [], "", 0, 0, 0, 0, "requested");
}
