import * as text from "../../../../kit/text.js";

/** Where a lenient sender digest is in its life cycle. */
export type LenientSenderDigestStatus = "created" | "validated" | "published" | "retired";

/** A lenient sender digest as the sender team keeps it. */
export class LenientSenderDigest {
  code: string;
  name: string;
  weight: number;
  externalRef: string;
  active: boolean;
  utmSource: string;
  impressions: number;
  status: LenientSenderDigestStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    externalRef: string,
    active: boolean,
    utmSource: string,
    impressions: number,
    status: LenientSenderDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.externalRef = externalRef;
    this.active = active;
    this.utmSource = utmSource;
    this.impressions = impressions;
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

  canMoveTo(next: LenientSenderDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientSenderDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sender digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient sender digest"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.impressions - this.weight) * 100) / 100;
  }

  copy(): LenientSenderDigest {
    return new LenientSenderDigest(
      this.code,
      this.name,
      this.weight,
      this.externalRef,
      this.active,
      this.utmSource,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient sender digest in status created. */
export function newLenientSenderDigest(code: string, name: string): LenientSenderDigest {
  return new LenientSenderDigest(code, name, 0, "", false, "", 0, "created");
}
