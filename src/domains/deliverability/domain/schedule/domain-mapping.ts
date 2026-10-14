import * as text from "../../../../kit/text.js";

/** Where a domain mapping is in its life cycle. */
export type DomainMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A domain mapping as the domain team keeps it. */
export class DomainMapping {
  code: string;
  label: string;
  sequence: number;
  retries: number;
  threshold: number;
  ceiling: number;
  ownerId: string;
  audienceId: string;
  utmSource: string;
  status: DomainMappingStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    retries: number,
    threshold: number,
    ceiling: number,
    ownerId: string,
    audienceId: string,
    utmSource: string,
    status: DomainMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.retries = retries;
    this.threshold = threshold;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.audienceId = audienceId;
    this.utmSource = utmSource;
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

  canMoveTo(next: DomainMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"domain mapping"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sequence + this.ceiling) * 100) / 100;
  }

  copy(): DomainMapping {
    return new DomainMapping(
      this.code,
      this.label,
      this.sequence,
      this.retries,
      this.threshold,
      this.ceiling,
      this.ownerId,
      this.audienceId,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a domain mapping in status requested. */
export function newDomainMapping(code: string, label: string): DomainMapping {
  return new DomainMapping(code, label, 0, 0, 0, 0, "", "", "", "requested");
}
